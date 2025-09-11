
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Garante que o admin seja inicializado apenas uma vez.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Apaga uma coleção em lotes para evitar erros de falta de memória em coleções grandes.
 * @param {FirebaseFirestore.CollectionReference} collectionRef A referência da coleção a ser apagada.
 * @param {number} batchSize O número de documentos a serem apagados em cada lote.
 */
async function deleteCollection(collectionRef, batchSize) {
  const query = collectionRef.orderBy("__name__").limit(batchSize);

  return new Promise((resolve, reject) => {
    deleteQueryBatch(query, resolve).catch(reject);
  });
}

async function deleteQueryBatch(query, resolve) {
  const snapshot = await query.get();

  // Quando não houver mais documentos, o processo está concluído.
  if (snapshot.size === 0) {
    return resolve();
  }

  // Cria um lote de exclusão.
  const batch = db.batch();
  snapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });
  await batch.commit();

  // Recorre para processar o próximo lote.
  process.nextTick(() => {
    deleteQueryBatch(query, resolve);
  });
}

/**
 * Função agendada para limpar sessões de chat antigas.
 * É executada uma vez a cada 24 horas.
 */
exports.cleanupOldChatSessions = functions
  .region("southamerica-east1") // Mantém a consistência da região
  .pubsub.schedule("every 24 hours")
  .onRun(async (context) => {
    console.log("Iniciando a limpeza diária de sessões de chat antigas.");

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoTimestamp = admin.firestore.Timestamp.fromDate(thirtyDaysAgo);

    // Consulta sessões que não foram atualizadas nos últimos 30 dias.
    const oldSessionsQuery = db.collection("chatSessions").where("updatedAt", "<", thirtyDaysAgoTimestamp);

    try {
      const snapshot = await oldSessionsQuery.get();

      if (snapshot.empty) {
        console.log("Nenhuma sessão de chat antiga para apagar.");
        return null;
      }

      console.log(`Encontradas ${snapshot.size} sessões de chat antigas para apagar.`);
      const promises = [];

      // Para cada sessão antiga, apaga a subcoleção de mensagens e depois a própria sessão.
      snapshot.forEach((doc) => {
        console.log(`Agendando exclusão da sessão ${doc.id} e suas mensagens.`);
        const messagesRef = doc.ref.collection("messages");
        
        // Adiciona a promessa de apagar a subcoleção de mensagens.
        promises.push(deleteCollection(messagesRef, 100));
        
        // Adiciona a promessa de apagar o documento da sessão principal.
        promises.push(doc.ref.delete());
      });

      // Executa todas as exclusões em paralelo.
      await Promise.all(promises);

      console.log("Limpeza de sessões de chat antigas concluída com sucesso.");
      return { status: "success", deletedCount: snapshot.size };

    } catch (error) {
      console.error("Erro durante a limpeza das sessões de chat:", error);
      // Lança um erro para que o serviço de Cloud Functions saiba que a execução falhou.
      throw new functions.https.HttpsError("internal", "Falha ao limpar sessões antigas.", error);
    }
  });
