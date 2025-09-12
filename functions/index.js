
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Firebase Admin and Gemini API
admin.initializeApp();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const db = admin.firestore();

/**
 * [FIXED] Triggered when a new message is sent by a visitor.
 * This function includes a transactional lock to prevent race conditions,
 * ensuring that only one AI response is processed at a time for a given chat session.
 */
exports.onNewVisitorMessage = onDocumentCreated(
  {
    document: "chatSessions/{sessionId}/messages/{messageId}",
    region: "southamerica-east1",
    secrets: ["GEMINI_API_KEY"],
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("No data associated with the event.");
      return;
    }

    const newMessage = snap.data();
    const sessionId = event.params.sessionId;
    const sessionRef = db.doc(`chatSessions/${sessionId}`);

    // Only trigger for messages from the 'user' (visitor)
    if (newMessage.role !== 'user') {
      console.log(`Message ${event.params.messageId} is not from a visitor. No AI action needed.`);
      return;
    }

    console.log(`New visitor message in session ${sessionId}. Attempting to acquire lock.`);

    try {
      // Transactional lock to prevent race conditions
      await db.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);

        if (!sessionDoc.exists) {
          throw new Error("Session document not found!");
        }

        if (sessionDoc.data().aiProcessing) {
          console.log(`AI is already processing for session ${sessionId}. Aborting.`);
          // By throwing an error, we abort the transaction and the function execution.
          // We'll catch this specific error to exit gracefully.
          throw new Error("AI_PROCESSING_LOCKED");
        }
        
        // Acquire the lock
        transaction.update(sessionRef, { aiProcessing: true });
      });

    } catch (error) {
        if (error.message === "AI_PROCESSING_LOCKED") {
            return; // Exit gracefully if another process has the lock
        }
        console.error(`Error acquiring lock for session ${sessionId}:`, error);
        return; // Exit if we fail to acquire the lock for other reasons
    }

    // --- Lock Acquired ---
    console.log(`Lock acquired for session ${sessionId}. Initiating AI response.`);

    try {
      const adminUserDoc = await db.doc(`users/${newMessage.adminId}`).get();
      const personalPrompt = adminUserDoc.exists() && adminUserDoc.data().aiPrompt
        ? adminUserDoc.data().aiPrompt
        : "You are a helpful customer service assistant.";

      const messagesRef = sessionRef.collection("messages");
      const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").limit(20).get();

      const history = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        const role = data.role === 'user' ? 'user' : 'model';
        return {
            role: role,
            parts: [{ text: data.content }],
        };
      });
      
      history.pop(); // The last message is the new prompt, so remove it from history

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(newMessage.content);
      const response = await result.response;
      const aiResponseText = response.text().trim();
      
      const aiMessage = {
        content: aiResponseText,
        role: 'assistant',
        senderId: 'ai_assistant',
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      };

      // Save the AI's response and update the session's last message
      const batch = db.batch();
      const newMsgRef = messagesRef.doc();
      batch.set(newMsgRef, aiMessage);
      batch.update(sessionRef, {
          lastMessage: aiResponseText,
          lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();
      
      console.log(`AI response for ${sessionId} saved successfully.`);

    } catch (error) {
      console.error(`Error processing AI response for session ${sessionId}:`, error);
    } finally {
      // CRITICAL: Release the lock regardless of success or failure
      await sessionRef.update({ aiProcessing: false });
      console.log(`Lock released for session ${sessionId}.`);
    }
  }
);


/**
 * FINAL: This function converts an anonymous ChatSession into a permanent, identified Conversation.
 * It creates a new Contact, a new Conversation, migrates all messages, and deletes the old session.
 */
exports.identifyLead = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'The function must be called while authenticated.');
  }

  const { sessionId, adminId, contactData } = request.data;
  const callingAdminId = request.auth.uid;
  
  if (callingAdminId !== adminId) {
      throw new HttpsError('permission-denied', 'You are not authorized to perform this action.');
  }

  if (!sessionId || !contactData || !contactData.name || !contactData.email) {
    throw new HttpsError('invalid-argument', 'Missing required data: sessionId and contactData (name, email).');
  }

  const sessionRef = db.doc(`chatSessions/${sessionId}`);
  const newContactRef = db.collection('contacts').doc();
  const newConversationRef = db.collection('conversations').doc();

  try {
    // Step 1: Run a transaction to create the core Contact and Conversation atomically.
    await db.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists) {
            throw new HttpsError('not-found', `Session with ID ${sessionId} not found.`);
        }
        const sessionData = sessionDoc.data();

        // Create the new Contact
        transaction.set(newContactRef, {
          id: newContactRef.id,
          ownerId: adminId,
          name: contactData.name,
          email: contactData.email,
          status: 'active',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          lastInteraction: sessionData.lastMessageTimestamp || admin.firestore.FieldValue.serverTimestamp(),
        });

        // Create the new Conversation, denormalizing the contact name
        transaction.set(newConversationRef, {
          id: newConversationRef.id,
          adminId: adminId,
          contactId: newContactRef.id,
          status: 'active',
          createdAt: sessionData.createdAt,
          lastMessage: sessionData.lastMessage || '',
          lastMessageTimestamp: sessionData.lastMessageTimestamp,
          unreadCount: 0, 
          contactName: contactData.name,
          contactAvatar: contactData.avatar || '',
        });
    });

    console.log(`Transaction successful. Contact ${newContactRef.id} and Conversation ${newConversationRef.id} created.`);

    // Step 2: Use a batch write to migrate messages and delete the old session.
    const messagesRef = sessionRef.collection('messages');
    const messagesSnapshot = await messagesRef.get();
    const writeBatch = db.batch();

    if (!messagesSnapshot.empty) {
        console.log(`Migrating ${messagesSnapshot.size} messages...`);
        messagesSnapshot.docs.forEach(msgDoc => {
            const newMsgRef = newConversationRef.collection('messages').doc(msgDoc.id);
            writeBatch.set(newMsgRef, msgDoc.data());
            writeBatch.delete(msgDoc.ref);
        });
    }

    // Delete the original session document
    writeBatch.delete(sessionRef);
    await writeBatch.commit();

    console.log(`Successfully migrated chat and deleted session ${sessionId}.`);
    return { status: 'success', conversationId: newConversationRef.id };

  } catch (error) {
    console.error(`Error in identifyLead for session ${sessionId}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'An error occurred while migrating the chat.');
  }
});

/**
 * [NEW] Archives a conversation and generates an AI summary.
 * This is a callable function invoked by an admin from the chat interface.
 */
exports.archiveAndSummarizeConversation = onCall(
  { region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    const { conversationId, contactId } = request.data;
    const adminId = request.auth.uid;

    if (!conversationId || !contactId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required data: conversationId and contactId."
      );
    }
    
    console.log(`Starting archive for conversation ${conversationId} by admin ${adminId}`);

    const convoRef = db.doc(`conversations/${conversationId}`);
    const contactRef = db.doc(`contacts/${contactId}`);
    const messagesRef = convoRef.collection("messages");

    try {
      const convoDoc = await convoRef.get();
      if (!convoDoc.exists) {
        throw new HttpsError("not-found", `Conversation ${conversationId} not found.`);
      }
      if (convoDoc.data().adminId !== adminId) {
          throw new HttpsError("permission-denied", "You are not the owner of this conversation.");
      }

      const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").get();
      if (messagesSnapshot.empty) {
        console.log("No messages to summarize. Archiving directly.");
        
        await convoRef.update({
          status: "archived",
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          summary: "No messages in this conversation.",
        });

        return { status: "success", summary: "No messages in this conversation." };
      }

      const history = messagesSnapshot.docs
        .map((doc) => {
          const msg = doc.data();
          const role = msg.role === "admin" ? "ADMIN" : "CLIENT";
          return `${role}: ${msg.content}`;
        })
        .join("\n");
      
      const prompt = `Please summarize the following conversation between a support agent (ADMIN) and a customer (CLIENT). The summary should be concise, in portuguese, max 2 sentences, and capture the main reason for the contact and the resolution. CONVERSATION:\n\n${history}`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const summaryText = response.text().trim();
      
      const batch = db.batch();

      batch.update(convoRef, {
        status: "archived",
        summary: summaryText,
        archivedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      
      batch.update(contactRef, {
        lastInteraction: admin.firestore.FieldValue.serverTimestamp(),
      });

      await batch.commit();
      
      console.log(`Successfully archived and summarized conversation ${conversationId}.`);
      return { status: "success", summary: summaryText };

    } catch (error) {
      console.error(
        `Error archiving conversation ${conversationId}:`,
        error
      );
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", "An unexpected error occurred while archiving the conversation.");
    }
  }
);
