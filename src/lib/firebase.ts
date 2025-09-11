// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
import { getDatabase } from "firebase/database";
// 1. Importar o getFunctions para o Cloud Functions
import { getFunctions } from "firebase/functions";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB3qOq0uWY2DnmmN08A6L8Gn0_qYvfIatI",
  authDomain: "omniflow-ai-mviw9.firebaseapp.com",
  projectId: "omniflow-ai-mviw9",
  storageBucket: "omniflow-ai-mviw9.firebasestorage.app",
  messagingSenderId: "904294888593",
  appId: "1:904294888593:web:2b8ad0686d59f65d07bb30",
  databaseURL: "https://omniflow-ai-mviw9-default-rtdb.firebaseio.com/"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);
const rtdb = getDatabase(app);
// 2. Inicializar o Cloud Functions
const functions = getFunctions(app, 'southamerica-east1'); // Especificar a região é uma boa prática

// 3. Exportar a nova instância do functions
export { app, db, auth, storage, rtdb, functions };
