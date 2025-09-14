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

// =================================================================================
// FUNÇÕES DE IA E CORE DO CHAT
// =================================================================================

// MODIFICAÇÃO: Nova função para pré-identificar o visitante
exports.onChatSessionCreated = onDocumentCreated(
  { document: "chatSessions/{sessionId}", region: "southamerica-east1" },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("No data associated with the event.");
      return;
    }

    const sessionData = snap.data();
    const sessionId = event.params.sessionId;
    const anonymousVisitorId = sessionData.anonymousVisitorId;

    if (!anonymousVisitorId) {
      console.log(`Sessão ${sessionId} criada sem um ID de visitante anônimo. Nenhuma ação necessária.`);
      return;
    }

    console.log(`Sessão ${sessionId} criada com ID de visitante anônimo: ${anonymousVisitorId}. Buscando contato correspondente.`);

    try {
      const contactsRef = db.collection('contacts');
      const querySnapshot = await contactsRef.where('anonymousVisitorIds', 'array-contains', anonymousVisitorId).limit(1).get();

      if (querySnapshot.empty) {
        console.log(`Nenhum contato encontrado para o ID de visitante anônimo: ${anonymousVisitorId}`);
        return;
      }

      const contactDoc = querySnapshot.docs[0];
      const contactId = contactDoc.id;
      const contactName = contactDoc.data().name;

      console.log(`Contato encontrado: ${contactName} (${contactId}). Atualizando a sessão de chat.`);

      await db.doc(`chatSessions/${sessionId}`).update({
        probableContactId: contactId,
        visitorName: `Provavelmente ${contactName}`
      });

      console.log(`Sessão ${sessionId} atualizada com o probableContactId: ${contactId}.`);

    } catch (error) {
      console.error(`Erro ao processar a pré-identificação para a sessão ${sessionId}:`, error);
    }
  }
);

exports.onNewVisitorMessage = onDocumentCreated(
  { document: "chatSessions/{sessionId}/messages/{messageId}", region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] },
  async (event) => { /* ...código inalterado... */ }
);

// =================================================================================
// FUNÇÕES DE GESTÃO DE CHATS E CONTATOS (Chamáveis pela Interface)
// =================================================================================

exports.toggleAIChat = onCall({ region: "southamerica-east1" }, async (request) => {
  /* ...código inalterado... */
});

exports.identifyLead = onCall({ region: "southamerica-east1" }, async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'A função deve ser chamada por um usuário autenticado.');
  }
  const { sessionId, adminId, contactData } = request.data;
  const callingAdminId = request.auth.uid;
  if (callingAdminId !== adminId) {
    throw new HttpsError('permission-denied', 'Você não tem autorização para realizar esta ação.');
  }
  if (!sessionId || !contactData || !contactData.name || !contactData.email) {
    throw new HttpsError('invalid-argument', 'Faltam dados obrigatórios: sessionId e contactData (name, email).');
  }

  const sessionRef = db.doc(`chatSessions/${sessionId}`);
  const newContactRef = db.collection('contacts').doc();
  const newConversationRef = db.collection('conversations').doc();
  const anonymousVisitorId = db.collection('contacts').doc().id;

  try {
    await db.runTransaction(async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      if (!sessionDoc.exists) throw new HttpsError('not-found', `Sessão ${sessionId} não encontrada.`);
      const sessionData = sessionDoc.data();
      
      const newContactPayload = {
        ...contactData,
        id: newContactRef.id, ownerId: adminId, status: 'active', createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastInteraction: sessionData.lastMessageTimestamp || admin.firestore.FieldValue.serverTimestamp(),
        anonymousVisitorIds: [anonymousVisitorId],
      };
      transaction.set(newContactRef, newContactPayload);
      
      transaction.set(newConversationRef, {
        id: newConversationRef.id, adminId: adminId, contactId: newContactRef.id, status: 'active', aiEnabled: true,
        createdAt: sessionData.createdAt, lastMessage: sessionData.lastMessage || '', lastMessageTimestamp: sessionData.lastMessageTimestamp,
        unreadCount: 0, contactName: contactData.name, contactAvatar: contactData.avatar || '',
      });
    });

    console.log(`Transação bem-sucedida. Contato ${newContactRef.id} e Conversa ${newConversationRef.id} criados.`);
    
    const messagesRef = sessionRef.collection('messages');
    const messagesSnapshot = await messagesRef.get();
    const writeBatch = db.batch();
    if (!messagesSnapshot.empty) {
      messagesSnapshot.docs.forEach(msgDoc => {
        const newMsgRef = newConversationRef.collection('messages').doc(msgDoc.id);
        writeBatch.set(newMsgRef, msgDoc.data());
        writeBatch.delete(msgDoc.ref);
      });
    }
    writeBatch.delete(sessionRef);
    await writeBatch.commit();
    
    console.log(`Chat migrado e sessão ${sessionId} apagada com sucesso.`);
    return { status: 'success', conversationId: newConversationRef.id, contactId: newContactRef.id, anonymousVisitorId: anonymousVisitorId };
  } catch (error) {
    console.error(`Erro em identifyLead para a sessão ${sessionId}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Ocorreu um erro ao migrar o chat.');
  }
});

exports.searchContacts = onCall({ region: "southamerica-east1" }, async (request) => {
  /* ...código inalterado... */
});

exports.connectSessionToContact = onCall({ region: "southamerica-east1" }, async (request) => {
    if (!request.auth) throw new HttpsError('unauthenticated', 'A função deve ser chamada por um usuário autenticado.');
    const adminId = request.auth.uid;
    const { sessionId, contactId } = request.data;
    if (!sessionId || !contactId) throw new HttpsError('invalid-argument', 'Faltam dados obrigatórios: sessionId e contactId.');

    const sessionRef = db.doc(`chatSessions/${sessionId}`);
    const contactRef = db.doc(`contacts/${contactId}`);
    const anonymousVisitorId = db.collection('contacts').doc().id;
    
    try {
        const sessionDoc = await sessionRef.get();
        if (!sessionDoc.exists) throw new HttpsError('not-found', `Sessão ${sessionId} não encontrada.`);
        const sessionData = sessionDoc.data();
        if(sessionData.adminId !== adminId) throw new HttpsError('permission-denied', 'Você não é o proprietário desta sessão.');

        const contactDoc = await contactRef.get();
        if (!contactDoc.exists || contactDoc.data().ownerId !== adminId) throw new HttpsError('not-found', `Contato ${contactId} não encontrado.`);
        const contactData = contactDoc.data();

        const activeConvoQuery = db.collection('conversations').where('contactId', '==', contactId).where('status', '==', 'active').limit(1);
        const activeConvoSnap = await activeConvoQuery.get();
        let targetConversationRef;

        if (activeConvoSnap.empty) {
            targetConversationRef = db.collection('conversations').doc();
            await targetConversationRef.set({
                id: targetConversationRef.id, adminId: adminId, contactId: contactId, status: 'active', aiEnabled: true, createdAt: sessionData.createdAt,
                lastMessage: sessionData.lastMessage || '', lastMessageTimestamp: sessionData.lastMessageTimestamp, unreadCount: 0,
                contactName: contactData.name, contactAvatar: contactData.avatar || '',
            });
        } else {
            targetConversationRef = activeConvoSnap.docs[0].ref;
            await targetConversationRef.update({ lastMessage: sessionData.lastMessage || '', lastMessageTimestamp: sessionData.lastMessageTimestamp });
        }

        const messagesRef = sessionRef.collection('messages');
        const messagesSnapshot = await messagesRef.get();
        const writeBatch = db.batch();
        writeBatch.update(contactRef, { anonymousVisitorIds: admin.firestore.FieldValue.arrayUnion(anonymousVisitorId) });

        if (!messagesSnapshot.empty) {
            messagesSnapshot.docs.forEach(msgDoc => {
                const newMsgRef = targetConversationRef.collection('messages').doc(msgDoc.id);
                writeBatch.set(newMsgRef, msgDoc.data());
                writeBatch.delete(msgDoc.ref);
            });
        }

        writeBatch.delete(sessionRef);
        await writeBatch.commit();

        console.log(`Sessão ${sessionId} conectada ao contato ${contactId} com sucesso.`);
        return { status: 'success', conversationId: targetConversationRef.id, anonymousVisitorId: anonymousVisitorId };
    } catch (error) {
        console.error(`Erro em connectSessionToContact para a sessão ${sessionId}:`, error);
        if (error instanceof HttpsError) throw error;
        throw new HttpsError('internal', 'Ocorreu um erro ao conectar a sessão ao contato.');
    }
});


// =================================================================================
// FUNÇÕES DE ARQUIVAMENTO E LIMPEZA
// =================================================================================

exports.archiveAndSummarizeConversation = onCall({ region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] }, async (request) => {
    /* ...código inalterado... */
  }
);

exports.cleanupOldChatSessions = onSchedule({ schedule: "every 24 hours", region: "southamerica-east1" }, async (event) => {
    /* ...código inalterado... */
  }
);

// =================================================================================
// FUNÇÕES HELPERS
// =================================================================================

async function deleteCollection(collectionRef, batchSize) { /* ...código inalterado... */ }

async function deleteQueryBatch(query, resolve) { /* ...código inalterado... */ }
