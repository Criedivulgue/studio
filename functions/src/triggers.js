const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { admin, db, model } = require("./config");

exports.onChatSessionCreated = onDocumentCreated(
  { document: "chatSessions/{sessionId}", region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const sessionData = snap.data();
    const sessionId = event.params.sessionId;
    const { adminId, anonymousVisitorId } = sessionData;

    const sendWelcomeMessage = async () => {
      if (!adminId) {
        console.log(`[Welcome] No adminId for session ${sessionId}, skipping.`);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 3000));
      const messagesRef = db.collection(`chatSessions/${sessionId}/messages`);
      const messagesSnapshot = await messagesRef.limit(1).get();
      if (!messagesSnapshot.empty) {
        console.log(`[Welcome] Session ${sessionId} already has messages, skipping.`);
        return;
      }
      try {
        const adminUserDoc = await db.doc(`users/${adminId}`).get();
        const knowledgeBase = adminUserDoc.data()?.aiPrompt || "";
        const systemInstruction = knowledgeBase;
        const chat = model.startChat({
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });
        const welcomePrompt = "Inicie a conversa com uma saudação de boas-vindas. Apresente-se brevemente com base na sua personalidade e pergunte como pode ajudar.";
        const result = await chat.sendMessage(welcomePrompt);
        const response = await result.response;
        const aiResponseText = response.text().trim();
        if (aiResponseText) {
          await messagesRef.add({
            content: aiResponseText,
            role: 'assistant',
            senderId: 'ai_assistant',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            read: false,
          });
          console.log(`[Welcome] AI Welcome message sent for session ${sessionId}.`);
        }
      } catch (error) {
        console.error(`[Welcome] Error sending AI welcome message for ${sessionId}:`, error);
      }
    };

    const preIdentifyContact = async () => {
      if (!anonymousVisitorId) {
        console.log(`[Identify] No anonymousVisitorId for session ${sessionId}, skipping.`);
        return;
      }
      try {
        const querySnapshot = await db.collection('contacts').where('anonymousVisitorIds', 'array-contains', anonymousVisitorId).limit(1).get();
        if (querySnapshot.empty) return;
        const contactDoc = querySnapshot.docs[0];
        await db.doc(`chatSessions/${sessionId}`).update({
          probableContactId: contactDoc.id,
          visitorName: `Provavelmente ${contactDoc.data().name}`
        });
        console.log(`[Identify] Pre-identified contact ${contactDoc.id} for session ${sessionId}.`);
      } catch (error) {
        console.error(`[Identify] Error in pre-identification for session ${sessionId}:`, error);
      }
    };

    await Promise.all([sendWelcomeMessage(), preIdentifyContact()]);
  }
);

exports.onNewVisitorMessage = onDocumentCreated(
  { document: "chatSessions/{sessionId}/messages/{messageId}", region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const newMessage = snap.data();
    if (newMessage.role !== 'user') {
      console.log("[Notification] Skipping notification for non-user message.");
      return;
    }

    const sessionId = event.params.sessionId;
    const sessionRef = db.doc(`chatSessions/${sessionId}`);

    // --- LÓGICA DE NOTIFICAÇÃO (COM LOGS DETALHADOS) ---
    try {
      console.log(`[Notification] Processing new message in session: ${sessionId}`);
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists) {
        console.log("[Notification] Session document not found.");
        return;
      }

      const sessionData = sessionDoc.data();
      const adminId = sessionData.adminId;
      if (!adminId) {
        console.log("[Notification] Admin ID not found in session document.");
        return;
      }
      console.log(`[Notification] Found Admin ID: ${adminId}`);

      const adminUserDoc = await db.doc(`users/${adminId}`).get();
      if (!adminUserDoc.exists) {
        console.log(`[Notification] Admin user document not found for ID: ${adminId}`);
        return;
      }

      const fcmTokens = adminUserDoc.data()?.fcmTokens;
      console.log(`[Notification] Retrieved FCM Tokens:`, fcmTokens);

      if (fcmTokens && Array.isArray(fcmTokens) && fcmTokens.length > 0) {
        console.log(`[Notification] Found ${fcmTokens.length} tokens. Preparing to send notification.`);
        const visitorName = sessionData.visitorName || 'Visitante Anônimo';
        const clickUrl = `/admin/live-chat?chatId=${sessionId}`;

        const payload = {
          notification: {
            title: `Nova mensagem de ${visitorName}`,
            body: newMessage.content,
            icon: '/favicon.ico',
          },
          data: { url: clickUrl },
          webpush: { fcm_options: { link: clickUrl } }
        };

        const response = await admin.messaging().sendToDevice(fcmTokens, payload);
        console.log("[Notification] Notification sent successfully.", response);
        
        const tokensToRemove = [];
        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            console.error('[Notification] Failure sending to token:', fcmTokens[index], error);
            if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
              tokensToRemove.push(fcmTokens[index]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          console.log(`[Notification] Removing ${tokensToRemove.length} invalid tokens.`);
          await adminUserDoc.ref.update({ fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove) });
        }
      } else {
        console.log("[Notification] No valid FCM tokens found for this user. Skipping notification.");
      }
    } catch (error) {
      console.error("[Notification] Critical error in notification logic:", error);
    }
    // --- FIM DA LÓGICA DE NOTIFICAÇÃO ---

    // --- LÓGICA DE PROCESSAMENTO DA IA ---
    try {
      await db.runTransaction(async (t) => {
        const sessionDoc = await t.get(sessionRef);
        if (!sessionDoc.exists) throw new Error("Session not found");
        const data = sessionDoc.data();
        if(data.aiEnabled === false) throw new Error("AI_DISABLED");
        if (data.aiProcessing) throw new Error("AI_PROCESSING_LOCKED");
        t.update(sessionRef, { aiProcessing: true });
      });
    } catch (error) {
      if (error.message === "AI_PROCESSING_LOCKED" || error.message === "AI_DISABLED") return;
      console.error(`[AI] Error acquiring lock for ${sessionId}:`, error);
      return;
    }

    try {
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) throw new Error(`Sessão ${sessionId} não encontrada.`);
        const sessionData = sessionDoc.data();
        if (!sessionData.adminId) throw new Error(`AdminId não encontrado na sessão ${sessionId}`);

        const globalAiSettingsDoc = await db.doc('system_settings/ai_global').get();
        const globalPrompt = globalAiSettingsDoc.data()?.prompt || "Você é um assistente prestativo.";
        const adminUserDoc = await db.doc(`users/${sessionData.adminId}`).get();
        const knowledgeBase = adminUserDoc.data()?.aiPrompt || "";

        const messagesRef = sessionRef.collection("messages");
        const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").get();

        const historyDocs = messagesSnapshot.docs.slice(0, -1);
        let history = historyDocs.map(doc => ({
          role: doc.data().role === 'user' ? 'user' : 'model',
          parts: [{ text: doc.data().content }]
        }));

        // CORREÇÃO: Validação e correção do Histórico mais robusta
        while (history.length > 0 && history[0].role === 'model') {
          history.shift(); // Remove todas as mensagens iniciais que sejam do modelo (IA)
        }

        const systemInstructionText = `${globalPrompt}\n\nUse o seguinte documento como sua base de conhecimento principal para responder:\n---\n${knowledgeBase}\n---`;

        const chat = model.startChat({
            history,
            systemInstruction: { parts: [{ text: systemInstructionText }] }
        });

        const result = await chat.sendMessage(newMessage.content);
        const response = await result.response;
        const aiResponseText = response.text().trim();

        if (aiResponseText) {
            await messagesRef.add({ content: aiResponseText, role: 'assistant', senderId: 'ai_assistant', timestamp: admin.firestore.FieldValue.serverTimestamp(), read: false });
        }

    } catch (error) {
        console.error(`[AI] Error processing AI response for ${sessionId}:`, error);
    } finally {
        await sessionRef.update({ aiProcessing: false });
    }
  }
);
