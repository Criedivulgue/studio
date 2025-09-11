const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");
const {GoogleGenerativeAI} = require("@google/generative-ai");

// Inicializa o Firebase Admin SDK
admin.initializeApp();

// Inicializa o Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({model: "gemini-pro"});

const db = admin.firestore();

exports.onNewVisitorMessage = onDocumentCreated(
  {
    document: "chatSessions/{sessionId}/messages/{messageId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("Nenhum dado associado ao evento.");
      return;
    }

    const newMessage = snap.data();
    const sessionId = event.params.sessionId;

    // ✅ CORREÇÃO CRÍTICA: Verificação mais robusta
    // A mensagem NÃO deve ser da IA (isAiResponse) e deve ser do visitante
    if (newMessage.isAiResponse || newMessage.senderId === newMessage.adminId) {
      console.log("Mensagem da IA, do admin ou duplicada. Nenhuma ação necessária.");
      return;
    }

    console.log(`Nova mensagem do visitante ${newMessage.senderId} na sessão ${sessionId}. Iniciando processo de resposta da IA.`);

    try {
      // 1. BUSCAR CONFIGURAÇÕES
      const [globalSettingsDoc, adminUserDoc] = await Promise.all([
        db.doc("system_settings/ai_global").get(),
        db.doc(`users/${newMessage.adminId}`).get(),
      ]);

      const globalPrompt = globalSettingsDoc.exists() && globalSettingsDoc.data().prompt ?
        globalSettingsDoc.data().prompt :
        "Você é um assistente de atendimento virtual prestativo.";

      const personalPrompt = adminUserDoc.exists() && adminUserDoc.data().aiPrompt ?
        adminUserDoc.data().aiPrompt :
        "";

      // 2. BUSCAR HISTÓRICO (limite maior para contexto melhor)
      const messagesRef = db.collection(`chatSessions/${sessionId}/messages`);
      const messagesSnapshot = await messagesRef
        .orderBy("timestamp", "asc")
        .limit(15) // Aumentado para 15 mensagens
        .get();

      const conversationHistory = messagesSnapshot.docs.map((doc) => {
        const data = doc.data();
        const sender = data.senderId === newMessage.adminId ? "Atendente" : "Cliente";
        return `${sender}: ${data.text}`;
      }).join("\n");

      // 3. CONSTRUIR PROMPT
      const finalPrompt = `
${globalPrompt}

${personalPrompt ? `---\nInstruções Adicionais:\n${personalPrompt}` : ""}

---
Baseado nas regras acima e no histórico abaixo, gere uma resposta curta, amigável e útil para o Cliente. Fale diretamente com o Cliente.

Histórico do Diálogo:
${conversationHistory}
---
Resposta:`.trim();

      // 4. GERAR RESPOSTA DA IA
      console.log("Gerando resposta com a IA...");
      const result = await model.generateContent(finalPrompt);
      const response = await result.response;
      const aiResponseText = response.text().trim();

      // 5. SALVAR RESPOSTA DA IA
      const aiMessage = {
        text: aiResponseText,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        senderId: newMessage.adminId,
        adminId: newMessage.adminId,
        visitorUid: newMessage.visitorUid,
        isAiResponse: true,
      };

      // ✅ Usar batch para operação atômica
      const batch = db.batch();
      const newMessageRef = db.collection(`chatSessions/${sessionId}/messages`).doc();
      batch.set(newMessageRef, aiMessage);

      // 6. ATUALIZAR SESSÃO
      const sessionRef = db.doc(`chatSessions/${sessionId}`);
      batch.update(sessionRef, {
        lastMessage: aiResponseText,
        lastMessageTimestamp: admin.firestore.FieldValue.serverTimestamp(),
        unreadCount: admin.firestore.FieldValue.increment(1), // ✅ Importante para notificar admin
      });

      await batch.commit();
      console.log("Resposta da IA salva e sessão atualizada com sucesso.");
    } catch (error) {
      console.error(`Erro ao processar mensagem na sessão ${sessionId}:`, error);

      // Mensagem de erro opcional
      const errorMessage = {
        text: "Desculpe, nosso assistente virtual não está disponível no momento. Um humano atenderá em breve.",
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        senderId: newMessage.adminId,
        adminId: newMessage.adminId,
        visitorUid: newMessage.visitorUid,
        isError: true,
      };

      await db.collection(`chatSessions/${sessionId}/messages`).add(errorMessage);
    }
  },
);
