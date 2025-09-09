
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Cloud Function (v2) para enviar uma notificação push a um administrador
 * quando uma nova conversa é criada para ele.
 *
 * Gatilho: onCreate em um novo documento na coleção /conversations.
 */
exports.notifyOnNewConversation = onDocumentCreated(
  {
    document: "conversations/{conversationId}",
    region: "southamerica-east1",
  },
  async (event) => {
    // 1. Obter os dados do evento. O snapshot do documento está em event.data.
    const snap = event.data;
    if (!snap) {
      console.log("Nenhum dado associado ao evento. Saindo.");
      return;
    }

    const conversation = snap.data();
    const adminId = conversation.adminId;
    const contactName = conversation.contactName || "Um novo cliente";

    // 2. Validação: Sair se não houver um adminId associado.
    if (!adminId) {
      console.log("A conversa não tem um adminId. Saindo.");
      return;
    }

    console.log(`Nova conversa para o admin: ${adminId}. Iniciada por: ${contactName}.`);

    try {
      // 3. Buscar o documento do administrador para encontrar seu token de notificação.
      const adminUserDoc = await admin.firestore().doc(`users/${adminId}`).get();

      if (!adminUserDoc.exists) {
        console.error(`Documento do usuário admin ${adminId} não encontrado.`);
        return;
      }

      const fcmToken = adminUserDoc.data().fcmToken;

      // 4. Validação: Sair se o admin não tiver um token FCM registrado.
      if (!fcmToken) {
        console.log(`Admin ${adminId} não possui um token FCM registrado. Não é possível notificar.`);
        return;
      }

      console.log(`Encontrado token FCM para ${adminId}: ${fcmToken}`);

      // 5. Montar a notificação push.
      const payload = {
        notification: {
          title: "Novo Lead na OmniFlow!",
          body: `${contactName} iniciou uma conversa e aguarda atendimento.`,
        },
      };

      // 6. Enviar a notificação para o dispositivo do administrador.
      console.log("Enviando notificação push...");
      const response = await admin.messaging().sendToDevice(fcmToken, payload);

      console.log("Notificação enviada com sucesso:", response.results);
    } catch (error) {
      console.error(
        "Erro ao processar a notificação de nova conversa:",
        error
      );
    }
  }
);
