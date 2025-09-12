const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { onSchedule } = require("firebase-functions/v2/scheduler"); // Correção: Importar o agendador v2
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Garante que o admin seja inicializado apenas uma vez.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Inicializa APIs
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
const db = admin.firestore();

// --- FUNÇÕES DE GATILHO (TRIGGERS) ---

/**
 * Disparado quando um novo visitante envia uma mensagem.
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

    if (newMessage.role !== 'user') {
      console.log(`Message ${event.params.messageId} is not from a visitor. No AI action needed.`);
      return;
    }

    console.log(`New visitor message in session ${sessionId}. Attempting to acquire lock.`);

    try {
      await db.runTransaction(async (transaction) => {
        const sessionDoc = await transaction.get(sessionRef);
        if (!sessionDoc.exists) {
          throw new Error("Session document not found!");
        }
        if (sessionDoc.data().aiProcessing) {
          throw new Error("AI_PROCESSING_LOCKED");
        }
        transaction.update(sessionRef, { aiProcessing: true });
      });
    } catch (error) {
      if (error.message === "AI_PROCESSING_LOCKED") {
        console.log(`AI is already processing for session ${sessionId}. Aborting.`);
        return;
      }
      console.error(`Error acquiring lock for session ${sessionId}:`, error);
      return;
    }

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
        return {
          role: data.role === 'user' ? 'user' : 'model',
          parts: [{ text: data.content }],
        };
      });
      history.pop();

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
      await sessionRef.update({ aiProcessing: false });
      console.log(`Lock released for session ${sessionId}.`);
    }
  }
);

// --- FUNÇÕES CHAMÁVEIS (CALLABLE) ---

/**
 * Converte um Lead anônimo em um Contato e Conversa permanentes.
 */
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

  try {
    await db.runTransaction(async (transaction) => {
      const sessionDoc = await transaction.get(sessionRef);
      if (!sessionDoc.exists) {
        throw new HttpsError('not-found', `Sessão com ID ${sessionId} não encontrada.`);
      }
      const sessionData = sessionDoc.data();
      transaction.set(newContactRef, {
        id: newContactRef.id,
        ownerId: adminId,
        name: contactData.name,
        email: contactData.email,
        status: 'active',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastInteraction: sessionData.lastMessageTimestamp || admin.firestore.FieldValue.serverTimestamp(),
      });
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

    console.log(`Transação bem-sucedida. Contato ${newContactRef.id} e Conversa ${newConversationRef.id} criados.`);
    const messagesRef = sessionRef.collection('messages');
    const messagesSnapshot = await messagesRef.get();
    const writeBatch = db.batch();
    if (!messagesSnapshot.empty) {
      console.log(`Migrando ${messagesSnapshot.size} mensagens...`);
      messagesSnapshot.docs.forEach(msgDoc => {
        const newMsgRef = newConversationRef.collection('messages').doc(msgDoc.id);
        writeBatch.set(newMsgRef, msgDoc.data());
        writeBatch.delete(msgDoc.ref);
      });
    }
    writeBatch.delete(sessionRef);
    await writeBatch.commit();
    console.log(`Chat migrado e sessão ${sessionId} apagada com sucesso.`);
    return { status: 'success', conversationId: newConversationRef.id };
  } catch (error) {
    console.error(`Erro em identifyLead para a sessão ${sessionId}:`, error);
    if (error instanceof HttpsError) throw error;
    throw new HttpsError('internal', 'Ocorreu um erro ao migrar o chat.');
  }
});

/**
 * Arquiva uma conversa e gera um resumo com IA.
 */
exports.archiveAndSummarizeConversation = onCall(
  { region: "southamerica-east1", secrets: ["GEMINI_API_KEY"] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "A função deve ser chamada por um usuário autenticado.");
    }
    const { conversationId, contactId } = request.data;
    const adminId = request.auth.uid;
    if (!conversationId || !contactId) {
      throw new HttpsError("invalid-argument", "Faltam dados obrigatórios: conversationId e contactId.");
    }
    console.log(`Iniciando arquivamento para a conversa ${conversationId} pelo admin ${adminId}`);
    const convoRef = db.doc(`conversations/${conversationId}`);
    const contactRef = db.doc(`contacts/${contactId}`);
    const messagesRef = convoRef.collection("messages");
    try {
      const convoDoc = await convoRef.get();
      if (!convoDoc.exists) {
        throw new HttpsError("not-found", `Conversa ${conversationId} não encontrada.`);
      }
      if (convoDoc.data().adminId !== adminId) {
        throw new HttpsError("permission-denied", "Você não é o proprietário desta conversa.");
      }
      const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").get();
      if (messagesSnapshot.empty) {
        console.log("Nenhuma mensagem para resumir. Arquivando diretamente.");
        await convoRef.update({
          status: "archived",
          archivedAt: admin.firestore.FieldValue.serverTimestamp(),
          summary: "Nenhuma mensagem nesta conversa.",
        });
        return { status: "success", summary: "Nenhuma mensagem nesta conversa." };
      }
      const history = messagesSnapshot.docs.map((doc) => {
        const msg = doc.data();
        const role = msg.role === "admin" ? "ADMIN" : "CLIENTE";
        return `${role}: ${msg.content}`;
      }).join("\n");
      const prompt = `Por favor, resuma a seguinte conversa entre um agente de suporte (ADMIN) e um cliente (CLIENTE). O resumo deve ser conciso, em português, com no máximo 2 frases, e capturar o motivo principal do contato e a resolução. CONVERSAÇÃO:\n\n${history}`;
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
      console.log(`Conversa ${conversationId} arquivada e resumida com sucesso.`);
      return { status: "success", summary: summaryText };
    } catch (error) {
      console.error(`Erro ao arquivar a conversa ${conversationId}:`, error);
      if (error instanceof HttpsError) throw error;
      throw new HttpsError("internal", "Ocorreu um erro inesperado ao arquivar a conversa.");
    }
  }
);

// --- FUNÇÕES AGENDADAS (SCHEDULED) ---

/**
 * Correção: Função de limpeza reescrita com a sintaxe v2 `onSchedule`.
 */
exports.cleanupOldChatSessions = onSchedule(
  {
    schedule: "every 24 hours",
    region: "southamerica-east1",
  },
  async (event) => {
    console.log("Iniciando a limpeza diária de sessões de chat antigas.");
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    const oldSessionsQuery = db.collection("chatSessions").where("lastMessageTimestamp", "<", thirtyDaysAgoTimestamp);

    try {
      const snapshot = await oldSessionsQuery.get();
      if (snapshot.empty) {
        console.log("Nenhuma sessão de chat antiga para apagar.");
        return null;
      }

      console.log(`Encontradas ${snapshot.size} sessões de chat antigas para apagar.`);
      const promises = snapshot.docs.map(doc => {
        console.log(`Agendando exclusão da sessão ${doc.id} e suas mensagens.`);
        // Apaga a subcoleção de mensagens e depois o documento principal.
        return deleteCollection(doc.ref.collection("messages"), 100).then(() => doc.ref.delete());
      });

      await Promise.all(promises);
      console.log("Limpeza de sessões de chat antigas concluída com sucesso.");
      return { status: "success", deletedCount: snapshot.size };

    } catch (error) {
      console.error("Erro durante a limpeza das sessões de chat:", error);
      // Para funções agendadas, lançar um erro é suficiente para indicar falha.
      throw new Error("Falha ao limpar sessões antigas.");
    }
  }
);

// --- FUNÇÕES AUXILIARES (HELPERS) ---

async function deleteCollection(collectionRef, batchSize) {
  const query = collectionRef.orderBy("__name__").limit(batchSize);
  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();
  if (snapshot.size === 0) {
    return resolve();
  }

  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}