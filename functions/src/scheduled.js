const { onSchedule } = require("firebase-functions/v2/scheduler");
const { admin, db } = require("./config");

// Função para deletar uma coleção em lotes
async function deleteCollection(collectionRef, batchSize) {
    const query = collectionRef.orderBy("__name__").limit(batchSize);
    return new Promise((resolve, reject) => {
        deleteQueryBatch(query, resolve).catch(reject);
    });
}

// Função auxiliar recursiva para deletar lotes de uma query
async function deleteQueryBatch(query, resolve) {
    const snapshot = await query.get();
    if (snapshot.size === 0) {
        return resolve();
    }
    const batch = db.batch();
    snapshot.docs.forEach(doc => batch.delete(doc.ref));
    await batch.commit();
    process.nextTick(() => {
        deleteQueryBatch(query, resolve);
    });
}

exports.cleanupOldChatSessions = onSchedule({ schedule: "every 24 hours", region: "southamerica-east1" }, async (event) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const oldSessionsQuery = db.collection("chatSessions").where("lastMessageTimestamp", "<", admin.firestore.Timestamp.fromDate(thirtyDaysAgo));
    try {
        const snapshot = await oldSessionsQuery.get();
        if (snapshot.empty) {
            console.log("Nenhuma sessão de chat antiga para limpar.");
            return null;
        }
        console.log(`Encontradas ${snapshot.size} sessões antigas para deletar.`);
        const promises = snapshot.docs.map(doc => deleteCollection(doc.ref.collection("messages"), 100).then(() => doc.ref.delete()));
        await Promise.all(promises);
        console.log(`Sucesso! ${snapshot.size} sessões antigas foram limpas.`);
        return { status: "success", deletedCount: snapshot.size };
    } catch (error) {
        console.error("Erro durante a limpeza das sessões de chat:", error);
        throw new Error("Falha ao limpar sessões antigas.");
    }
});
