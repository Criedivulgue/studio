
const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.notifyNewMessage = functions.firestore
  .document("users/{userId}/conversations/{conversationId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const userId = context.params.userId;
    const conversationId = context.params.conversationId;

    // Evitar auto-notificação
    // O gatilho é na coleção de mensagens do usuário admin,
    // então a notificação deve ser para o "outro lado".
    // Neste modelo, o "outro lado" é o super-admin.
    if (message.senderId === "super-admin") {
      // Mensagem do super-admin para o admin
      const userRef = admin.firestore().doc(`users/${userId}`);
      const conversationRef = userRef.collection("conversations").doc(conversationId);
      const conversationDoc = await conversationRef.get();
      const conversationName = conversationDoc.data().name || "um usuário";

      console.log(`Notifying user ${userId} about new message`);

      return userRef.collection("notifications").add({
        message: `Nova mensagem de ${conversationName}`,
        conversationPath: conversationRef.path,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    } else {
      // Mensagem do admin para o super-admin
      const superAdminRef = admin.firestore().doc("users/super-admin");
      const conversationRef = admin
        .firestore()
        .doc(`users/${userId}/conversations/${conversationId}`);
      
      const userDoc = await admin.firestore().doc(`users/${userId}`).get();
      const userName = userDoc.data().name || "Admin";


      console.log(`Notifying super-admin about new message from ${userName}`);

      return superAdminRef.collection("notifications").add({
        message: `Nova mensagem de ${userName}`,
        conversationPath: conversationRef.path,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });
