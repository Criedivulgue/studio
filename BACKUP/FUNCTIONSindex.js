const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });
const db = admin.firestore();

exports.onChatSessionCreated = onDocumentCreated(
  { document: "chatSessions/{sessionId}", region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const sessionData = snap.data();
    const sessionId = event.params.sessionId;
    const { adminId, anonymousVisitorId } = sessionData;

    // Lógica encapsulada para enviar a mensagem de boas-vindas da IA
    const sendWelcomeMessage = async () => {
      if (!adminId) {
        console.log(`[Welcome] No adminId for session ${sessionId}, skipping.`);
        return;
      }

      // Delay de 3 segundos para humanizar a interação
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
        // A instrução global já é pega pela IA, focamos no prompt específico
        const systemInstruction = knowledgeBase;

        const chat = model.startChat({
            systemInstruction: { parts: [{ text: systemInstruction }] }
        });

        // Prompt simples para a IA iniciar a conversa
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

    // Lógica encapsulada para pré-identificar o contato
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

    // Executa ambas as lógicas em paralelo para não bloquear uma à outra
    await Promise.all([sendWelcomeMessage(), preIdentifyContact()]);
  }
);

exports.onNewVisitorMessage = onDocumentCreated(
  { document: "chatSessions/{sessionId}/messages/{messageId}", region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] },
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const newMessage = snap.data();
    if (newMessage.role !== 'user') return;

    const sessionId = event.params.sessionId;
    const sessionRef = db.doc(`chatSessions/${sessionId}`);

    // --- LÓGICA DE NOTIFICAÇÃO ---
    try {
      const sessionDoc = await sessionRef.get();
      if (!sessionDoc.exists) return;
      const sessionData = sessionDoc.data();
      const adminId = sessionData.adminId;
      if (!adminId) return;

      const adminUserDoc = await db.doc(`users/${adminId}`).get();
      if (!adminUserDoc.exists) return;
      const fcmTokens = adminUserDoc.data()?.fcmTokens;

      if (fcmTokens && Array.isArray(fcmTokens) && fcmTokens.length > 0) {
        const visitorName = sessionData.visitorName || 'Visitante Anônimo';
        const payload = {
          notification: {
            title: `Nova mensagem de ${visitorName}`,
            body: newMessage.content,
            icon: '/favicon.ico',
          },
          webpush: {
            fcm_options: {
              link: `/admin/live-chat?chatId=${sessionId}`
            }
          }
        };

        const response = await admin.messaging().sendToDevice(fcmTokens, payload);
        const tokensToRemove = [];
        response.results.forEach((result, index) => {
          const error = result.error;
          if (error) {
            console.error('Falha ao enviar notificação para', fcmTokens[index], error);
            if (error.code === 'messaging/invalid-registration-token' || error.code === 'messaging/registration-token-not-registered') {
              tokensToRemove.push(fcmTokens[index]);
            }
          }
        });

        if (tokensToRemove.length > 0) {
          await adminUserDoc.ref.update({ fcmTokens: admin.firestore.FieldValue.arrayRemove(...tokensToRemove) });
        }
      }
    } catch (error) {
      console.error("Erro ao enviar notificação:", error);
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
      console.error(`Erro ao adquirir lock para ${sessionId}:`, error);
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
        const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").limit(20).get();

        const history = messagesSnapshot.docs.map(doc => ({ role: doc.data().role === 'user' ? 'user' : 'model', parts: [{ text: doc.data().content }] }));

        const systemInstructionText = `${globalPrompt}\n\nUse o seguinte documento como sua base de conhecimento principal para responder:\n---\n${knowledgeBase}\n---`;

        const chat = model.startChat({
            history,
            systemInstruction: { parts: [{ text: systemInstructionText }] }
        });

        const result = await chat.sendMessage("Responda a última pergunta do usuário com base no histórico e na sua base de conhecimento.");
        const response = await result.response;
        const aiResponseText = response.text().trim();

        await messagesRef.add({ content: aiResponseText, role: 'assistant', senderId: 'ai_assistant', timestamp: admin.firestore.FieldValue.serverTimestamp(), read: false });
    } catch (error) {
        console.error(`Erro no processamento da IA para ${sessionId}:`, error);
    } finally {
        await sessionRef.update({ aiProcessing: false });
    }
  }
);

exports.toggleAIChat = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
  const { sessionId, enabled } = request.data;
  if (!sessionId || typeof enabled !== 'boolean') throw new HttpsError('invalid-argument', 'Argumentos inválidos.');
  const adminId = request.auth.uid;
  const sessionRef = db.doc(`chatSessions/${sessionId}`);
  try {
    const doc = await sessionRef.get();
    if (!doc.exists || doc.data().adminId !== adminId) throw new HttpsError('not-found', 'Sessão não encontrada.');
    await sessionRef.update({ aiEnabled: enabled });
    return { success: true, message: `IA ${enabled ? 'ativada' : 'desativada'}.` };
  } catch (error) {
    console.error(`Erro em toggleAIChat para ${sessionId}:`, error);
    throw new HttpsError('internal', 'Erro ao alterar estado da IA.');
  }
});

exports.identifyLead = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'A função deve ser chamada por um usuário autenticado.');
  const { sessionId, adminId, contactData } = request.data;
  if (request.auth.uid !== adminId) throw new HttpsError('permission-denied', 'Você não tem autorização.');
  if (!sessionId || !contactData?.name || !contactData?.email) throw new HttpsError('invalid-argument', 'Faltam dados obrigatórios.');

  const sessionRef = db.doc(`chatSessions/${sessionId}`);
  const newContactRef = db.collection('contacts').doc();
  const newConversationRef = db.collection('conversations').doc();
  const anonymousVisitorId = db.collection('contacts').doc().id;

  try {
    await db.runTransaction(async (t) => {
      const sessionDoc = await t.get(sessionRef);
      if (!sessionDoc.exists) throw new HttpsError('not-found', `Sessão ${sessionId} não encontrada.`);
      const sessionData = sessionDoc.data();
      const newContactPayload = { ...contactData, id: newContactRef.id, ownerId: adminId, status: 'active', createdAt: admin.firestore.FieldValue.serverTimestamp(), lastInteraction: sessionData.lastMessageTimestamp || admin.firestore.FieldValue.serverTimestamp(), anonymousVisitorIds: [anonymousVisitorId] };
      t.set(newContactRef, newContactPayload);
      t.set(newConversationRef, { id: newConversationRef.id, adminId, contactId: newContactRef.id, status: 'active', createdAt: sessionData.createdAt, lastMessage: sessionData.lastMessage || '', lastMessageTimestamp: sessionData.lastMessageTimestamp, unreadCount: 0, contactName: contactData.name, contactAvatar: contactData.avatar || '', aiEnabled: sessionData.aiEnabled ?? true });
    });

    const messagesSnapshot = await sessionRef.collection('messages').get();
    const batch = db.batch();
    if (!messagesSnapshot.empty) {
      messagesSnapshot.docs.forEach(doc => {
        batch.set(newConversationRef.collection('messages').doc(doc.id), doc.data());
        batch.delete(doc.ref);
      });
    }
    batch.delete(sessionRef);
    await batch.commit();
    return { status: 'success', conversationId: newConversationRef.id, contactId: newContactRef.id, anonymousVisitorId };
  } catch (error) {
    console.error(`Erro em identifyLead para ${sessionId}:`, error);
    throw new HttpsError('internal', 'Ocorreu um erro ao migrar o chat.');
  }
});

exports.connectSessionToContact = onCall({ region: "southamerica-east1" }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
    const adminId = request.auth.uid;
    const { sessionId, contactId } = request.data;
    if (!sessionId || !contactId) throw new HttpsError('invalid-argument', 'Argumentos inválidos.');

    const sessionRef = db.doc(`chatSessions/${sessionId}`);
    const contactRef = db.doc(`contacts/${contactId}`);
    const anonymousVisitorId = db.collection('contacts').doc().id;
    
    try {
        const [sessionDoc, contactDoc] = await Promise.all([sessionRef.get(), contactRef.get()]);
        if (!sessionDoc.exists || sessionDoc.data().adminId !== adminId) throw new HttpsError('not-found', 'Sessão não encontrada ou sem permissão.');
        if (!contactDoc.exists || contactDoc.data().ownerId !== adminId) throw new HttpsError('not-found', 'Contato não encontrado ou sem permissão.');
        
        const sessionData = sessionDoc.data();
        const contactData = contactDoc.data();
        const activeConvoSnap = await db.collection('conversations').where('contactId', '==', contactId).where('status', '==', 'active').limit(1).get();
        const targetConversationRef = activeConvoSnap.empty ? db.collection('conversations').doc() : activeConvoSnap.docs[0].ref;
        const batch = db.batch();
        if (activeConvoSnap.empty) {
            batch.set(targetConversationRef, { id: targetConversationRef.id, adminId, contactId, status: 'active', createdAt: sessionData.createdAt, lastMessage: sessionData.lastMessage, lastMessageTimestamp: sessionData.lastMessageTimestamp, unreadCount: 0, contactName: contactData.name, contactAvatar: contactData.avatar || '', aiEnabled: sessionData.aiEnabled ?? true });
        }
        const messagesSnapshot = await sessionRef.collection('messages').get();
        if (!messagesSnapshot.empty) {
            messagesSnapshot.docs.forEach(doc => {
                batch.set(targetConversationRef.collection('messages').doc(doc.id), doc.data());
                batch.delete(doc.ref);
            });
        }
        batch.update(contactRef, { anonymousVisitorIds: admin.firestore.FieldValue.arrayUnion(anonymousVisitorId) });
        batch.delete(sessionRef);
        await batch.commit();
        return { status: 'success', conversationId: targetConversationRef.id, anonymousVisitorId };
    } catch (error) {
        console.error(`Erro em connectSessionToContact para ${sessionId}:`, error);
        throw new HttpsError('internal', 'Ocorreu um erro ao conectar a sessão.');
    }
});

exports.searchContacts = onCall({ region: "southamerica-east1" }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'Usuário não autenticado.');
    const { searchTerm } = request.data;
    const adminId = request.auth.uid;
    if (!searchTerm) return { contacts: [] };
    try {
        const contactsRef = db.collection('contacts');
        const query = contactsRef.where('ownerId', '==', adminId).orderBy('name');
        const snapshot = await query.get();
        const lowerCaseSearchTerm = searchTerm.toLowerCase();
        const contacts = snapshot.docs.map(doc => doc.data()).filter(c => c.name.toLowerCase().includes(lowerCaseSearchTerm) || (c.email && c.email.toLowerCase().includes(lowerCaseSearchTerm)));
        return { contacts };
    } catch (error) {
        console.error('Erro ao buscar contatos:', error);
        throw new HttpsError('internal', 'Erro ao buscar contatos.');
    }
});

exports.archiveAndSummarizeConversation = onCall({ region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] }, async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "A função deve ser chamada por um usuário autenticado.");
    const { conversationId, contactId } = request.data;
    const adminId = request.auth.uid;
    if (!conversationId || !contactId) throw new HttpsError("invalid-argument", "Faltam dados obrigatórios: conversationId e contactId.");

    const convoRef = db.doc(`conversations/${conversationId}`);
    const contactRef = db.doc(`contacts/${contactId}`);
    try {
        const convoDoc = await convoRef.get();
        if (!convoDoc.exists || convoDoc.data().adminId !== adminId) throw new HttpsError("permission-denied", "Você não é o proprietário desta conversa.");

        const messagesSnapshot = await convoRef.collection("messages").orderBy("timestamp", "asc").get();
        let summaryText = "Nenhuma mensagem nesta conversa.";
        if (!messagesSnapshot.empty) {
            const history = messagesSnapshot.docs.map(doc => `${doc.data().role}: ${doc.data().content}`).join("\n");
            const prompt = `Por favor, resuma a seguinte conversa. O resumo deve ser conciso, em português, com no máximo 2 frases, capturando o motivo principal do contato e a resolução. CONVERSAÇÃO:\n\n${history}`;
            const result = await model.generateContent(prompt);
            summaryText = (await result.response).text().trim();
        }

        const batch = db.batch();
        batch.update(convoRef, { status: "archived", summary: summaryText, archivedAt: admin.firestore.FieldValue.serverTimestamp() });
        batch.update(contactRef, { lastInteraction: admin.firestore.FieldValue.serverTimestamp() });
        await batch.commit();
        return { status: "success", summary: summaryText };
    } catch (error) { console.error(`Erro ao arquivar a conversa ${conversationId}:`, error); throw new HttpsError("internal", "Erro ao arquivar a conversa."); }
});

exports.cleanupOldChatSessions = onSchedule({ schedule: "every 24 hours", region: "southamerica-east1" }, async (event) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldSessionsQuery = db.collection("chatSessions").where("lastMessageTimestamp", "<", admin.firestore.Timestamp.fromDate(thirtyDaysAgo));
    try {
        const snapshot = await oldSessionsQuery.get();
        if (snapshot.empty) return null;
        const promises = snapshot.docs.map(doc => deleteCollection(doc.ref.collection("messages"), 100).then(() => doc.ref.delete()));
        await Promise.all(promises);
        return { status: "success", deletedCount: snapshot.size };
    } catch (error) { console.error("Erro durante a limpeza das sessões de chat:", error); throw new Error("Falha ao limpar sessões antigas."); }
});

async function deleteCollection(collectionRef, batchSize) {
    const query = collectionRef.orderBy("__name__").limit(batchSize);
    return new Promise((resolve, reject) => { deleteQueryBatch(query, resolve).catch(reject); });
}

async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();
    if (snapshot.size === 0) return resolve();
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    process.nextTick(() => { deleteQueryBatch(query, resolve); });
}
