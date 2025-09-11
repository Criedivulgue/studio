
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
 * REFACTORED: Triggered when a new message is sent by a visitor.
 * This function now uses the Gemini Chat API for more natural conversations
 * and aligns with the unified `Message` type.
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

    // Only trigger for messages from the 'user' (visitor)
    if (newMessage.role !== 'user') {
      console.log("Message is not from a visitor. No AI action needed.");
      return;
    }

    console.log(`New visitor message in session ${sessionId}. Initiating AI response.`);

    try {
      const adminUserDoc = await db.doc(`users/${newMessage.adminId}`).get();
      const personalPrompt = adminUserDoc.exists() && adminUserDoc.data().aiPrompt
        ? adminUserDoc.data().aiPrompt
        : "You are a helpful customer service assistant.";

      const messagesRef = db.collection(`chatSessions/${sessionId}/messages`);
      const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").limit(20).get();

      // Format history for Gemini Chat API
      const history = messagesSnapshot.docs.map(doc => {
        const data = doc.data();
        const role = data.role === 'user' ? 'user' : 'model'; // Visitor is 'user', AI/Admin is 'model'
        return {
            role: role,
            parts: [{ text: data.content }],
        };
      });
      
      // The last message is the new prompt, so remove it from history
      history.pop();

      const chat = model.startChat({ history });
      const result = await chat.sendMessage(newMessage.content);
      const response = await result.response;
      const aiResponseText = response.text().trim();
      
      // Create AI response message according to the unified `Message` type
      const aiMessage = {
        content: aiResponseText,
        role: 'assistant', // AI's role is 'assistant'
        senderId: 'ai_assistant', // Special ID for the AI
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      };

      // Save the AI's response and update the session's last message
      const batch = db.batch();
      const newMsgRef = messagesRef.doc();
      batch.set(newMsgRef, aiMessage);
      batch.update(db.doc(`chatSessions/${sessionId}`), {
          lastMessage: aiResponseText,
          lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
      await batch.commit();
      
      console.log("AI response saved successfully.");

    } catch (error) {
      console.error(`Error processing message in session ${sessionId}:`, error);
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
