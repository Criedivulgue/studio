const {onDocumentCreated} = require("firebase-functions/v2/firestore");
const admin = require("firebase-admin");

const {archiveAndSummarizeConversation} = require("./archive.js");

admin.initializeApp();

/**
 * Cloud Function para notificar um administrador sobre uma nova conversa.
 * Ação 1: Cria um documento de notificação persistente na coleção 'notifications'.
 * Ação 2: Envia uma notificação push (FCM) para o dispositivo do admin.
 *
 * Gatilho: onCreate em /conversations/{conversationId}.
 */
exports.notifyOnNewConversation = onDocumentCreated(
  {
    document: "conversations/{conversationId}",
    region: "southamerica-east1",
  },
  async (event) => {
    const snap = event.data;
    if (!snap) {
      console.log("Nenhum dado associado ao evento. Saindo.");
      return;
    }

    const conversationId = event.params.conversationId;
    const conversation = snap.data();
    const adminId = conversation.adminId;
    const contactName = conversation.contactName || "Um novo cliente";

    if (!adminId) {
      console.log("A conversa não tem um adminId. Saindo.");
      return;
    }

    console.log(`Nova conversa para o admin: ${adminId}. Iniciada por: ${contactName}.`);

    const notificationTitle = "Novo Lead na OmniFlow!";
    const notificationBody = `${contactName} iniciou uma conversa e aguarda atendimento.`;
    const notificationUrl = `/admin/dashboard/conversations/${conversationId}`;

    try {
      // AÇÃO 1: Criar notificação persistente no Firestore
      const notificationRef = admin.firestore().collection("notifications").add({
        adminId: adminId,
        title: notificationTitle,
        body: notificationBody,
        url: notificationUrl,
        isRead: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      console.log(`Documento de notificação criado para o admin ${adminId}.`);

      // AÇÃO 2: Enviar notificação push via FCM
      const adminUserDoc = await admin.firestore().doc(`users/${adminId}`).get();
      if (!adminUserDoc.exists) {
        console.error(`Documento do usuário admin ${adminId} não encontrado.`);
        return;
      }

      const fcmToken = adminUserDoc.data().fcmToken;
      if (!fcmToken) {
        console.log(`Admin ${adminId} não possui um token FCM registrado.`);
        // Não retorna, pois a notificação persistente já foi criada.
      } else {
        console.log(`Encontrado token FCM para ${adminId}: ${fcmToken}`);
        const payload = {
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          webpush: {
            fcm_options: {
              link: notificationUrl, // Garante que o clique na notificação push leve ao lugar certo
            },
          },
        };

        console.log("Enviando notificação push...");
        await admin.messaging().sendToDevice(fcmToken, payload);
        console.log("Notificação push enviada com sucesso.");
      }
      // Aguarda a promessa da notificação ser resolvida.
      await notificationRef;
    } catch (error) {
      console.error(
        "Erro ao processar a notificação de nova conversa:",
        error,
      );
    }
  },
);

// Exporta a função de arquivamento
exports.archiveAndSummarizeConversation = archiveAndSummarizeConversation;
