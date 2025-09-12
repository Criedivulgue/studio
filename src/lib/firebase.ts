import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getDatabase, Database } from "firebase/database";
import { getFunctions, Functions } from "firebase/functions";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let rtdb: Database;
let functions: Functions;

const initializeFirebase = async () => {
  if (getApps().length) {
    return;
  }

  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao buscar a configuração do Firebase. Status: ${response.status}. Resposta: ${errorText}`);
    }
    const firebaseConfig = await response.json();

    if (!firebaseConfig.apiKey) {
        throw new Error('Configuração do Firebase inválida recebida da API.');
    }

    app = initializeApp(firebaseConfig);
    
  } catch (error) {
    console.error("ERRO CRÍTICO: Falha ao inicializar o Firebase.", error);
    throw error;
  }
};

let firebaseInitializationPromise: Promise<void> | null = null;

export const ensureFirebaseInitialized = () => {
  if (!firebaseInitializationPromise) {
    firebaseInitializationPromise = initializeFirebase();
  }
  return firebaseInitializationPromise;
};

export const getFirebaseInstances = () => {
    if (!app) {
        throw new Error("Tentativa de usar o Firebase antes da conclusão da inicialização.");
    }
    
    if (!db) db = getFirestore(app);
    if (!auth) auth = getAuth(app);
    if (!storage) storage = getStorage(app);
    if (!rtdb) rtdb = getDatabase(app);
    if (!functions) functions = getFunctions(app, 'southamerica-east1');
    
    return { app, db, auth, storage, rtdb, functions };
}