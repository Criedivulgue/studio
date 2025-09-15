const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { admin, db, model } = require("./config");

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
