const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Inicializa o Firebase Admin SDK se ainda não foi inicializado.
if (admin.apps.length === 0) {
  admin.initializeApp();
}

// Inicializa o Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" });

// Exporta instâncias e configurações para serem usadas em outras partes da aplicação.
const db = admin.firestore();

module.exports = {
  admin,
  db,
  genAI,
  model,
};
