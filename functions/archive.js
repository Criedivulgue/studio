
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Importe o SDK do Vertex AI
const {VertexAI} = require("@google-cloud/vertexai");

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

// Inicialize o Vertex AI
const vertexAi = new VertexAI({project: process.env.GCLOUD_PROJECT, location: "southamerica-east1"});
const model = "gemini-1.0-pro-001"; // Ou o modelo que você preferir

const generativeModel = vertexAi.preview.getGenerativeModel({
  model: model,
  generation_config: {
    "max_output_tokens": 2048,
    "temperature": 0.2,
    "top_p": 1,
  },
});

/**
 * Função centralizada para arquivar uma conversa.
 * 1. Gera um resumo da IA combinando prompts globais e pessoais.
 * 2. Atualiza o status da conversa para 'archived'.
 * 3. Salva o resumo no histórico permanente do contato.
 */
// FIX: Adicionada a região para consistência com o resto da aplicação.
exports.archiveAndSummarizeConversation = functions.region("southamerica-east1").https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "O usuário não está autenticado.");
  }

  const {conversationId, contactId} = data;
  if (!conversationId || !contactId) {
    throw new functions.https.HttpsError("invalid-argument", "Os IDs da conversa e do contato são obrigatórios.");
  }

  console.log(`Iniciando arquivamento para a conversa: ${conversationId} e contato: ${contactId}`);

  try {
    // 1. Obter dados da conversa
    const conversationRef = db.collection("conversations").doc(conversationId);
    const conversationDoc = await conversationRef.get();
    if (!conversationDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Conversa não encontrada.");
    }
    const adminId = conversationDoc.data().adminId;
    if (!adminId) {
      throw new functions.https.HttpsError("failed-precondition", "A conversa não possui um administrador associado.");
    }

    // 2. Buscar prompts (Global e Pessoal)
    const globalSettingsRef = db.collection("system_settings").doc("ai_global");
    const globalSettingsDoc = await globalSettingsRef.get();
    const globalPrompt = globalSettingsDoc.exists() ? globalSettingsDoc.data().prompt : "Resuma a conversa.";

    const adminUserRef = db.collection("users").doc(adminId);
    const adminUserDoc = await adminUserRef.get();
    const personalPrompt = adminUserDoc.exists() ? adminUserDoc.data().aiPrompt : "";

    // 3. Buscar mensagens e formatar diálogo
    const messagesRef = conversationRef.collection("messages");
    // FIX: Ordenando por 'timestamp', que é o nome correto do campo.
    const messagesSnapshot = await messagesRef.orderBy("timestamp", "asc").get();

    // CORREÇÃO CRÍTICA: Usa msg.role para identificar o remetente, que é o campo correto usado no sistema.
    const getRoleLabel = (role) => {
      if (role === 'user') return 'Cliente';
      if (role === 'admin') return 'Atendente';
      if (role === 'assistant') return 'Assistente IA';
      return 'Sistema';
    };

    const dialog = messagesSnapshot.docs.map((doc) => {
      const msg = doc.data();
      // FIX: Usando o helper getRoleLabel com o campo correto `msg.role`
      return `${getRoleLabel(msg.role)}: ${msg.content}`;
    }).join("\n");

    let generatedSummary = "A conversa foi arquivada sem mensagens para resumir.";

    if (dialog) {
      // 4. Construir o prompt final e chamar a IA
      const finalPrompt = `
          ${globalPrompt}
          ${personalPrompt ? `---\nInstruções Adicionais:\n${personalPrompt}` : ""}
          ---
          Com base nas regras acima, resuma o seguinte diálogo em um parágrafo conciso:
          ${dialog}
        `;
      const req = {contents: [{role: "user", parts: [{text: finalPrompt}]}]};
      const resp = await generativeModel.generateContent(req);
      
      // Adicionada checagem de segurança para a estrutura da resposta da IA.
      if (resp.response && resp.response.candidates && resp.response.candidates.length > 0 && resp.response.candidates[0].content && resp.response.candidates[0].content.parts && resp.response.candidates[0].content.parts.length > 0) {
          generatedSummary = resp.response.candidates[0].content.parts[0].text;
      } else {
          console.warn("Não foi possível gerar um resumo da IA, usando o padrão. Resposta foi:", JSON.stringify(resp));
          generatedSummary = "Não foi possível gerar um resumo da IA para esta conversa.";
      }
    }

    console.log(`Resumo gerado: ${generatedSummary}`);

    // 5. Salvar o resumo no histórico do contato
    const historyRef = db.collection("contacts").doc(contactId).collection("history").doc(conversationId);
    await historyRef.set({
      summary: generatedSummary,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      adminId: adminId,
      conversationPath: conversationRef.path,
    });
    console.log(`Resumo salvo no histórico do contato ${contactId}.`);

    // 6. Atualizar o documento da conversa principal
    await conversationRef.update({
      status: "archived",
      summary: generatedSummary, // O resumo também é salvo aqui para referência
      archivedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Conversa ${conversationId} arquivada com sucesso.`);
    return {status: "success", message: "Conversa arquivada e histórico atualizado."};
  } catch (error) {
    console.error(`Erro ao arquivar a conversa ${conversationId}:`, error);
    throw new functions.https.HttpsError("internal", "Ocorreu um erro interno ao processar o arquivamento.", error);
  }
});
