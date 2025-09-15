'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getStorage, FirebaseStorage } from "firebase/storage";
import { getDatabase, Database } from "firebase/database";
import { getFunctions, Functions } from "firebase/functions";
// 1. IMPORTAR getMessaging e Messaging
import { getMessaging, Messaging } from "firebase/messaging";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let storage: FirebaseStorage;
let rtdb: Database;
let functions: Functions;
// 2. DECLARAR a variável de messaging
let messaging: Messaging | null = null; // Inicia como nulo

let firebaseInitialized = false;

const initializeFirebase = async () => {
  if (firebaseInitialized) {
    return;
  }

  try {
    const response = await fetch('/api/firebase-config');
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Falha ao buscar a configuração do Firebase. Status: ${response.status}. Resposta: ${errorText}`);
    }
    const firebaseConfig = await response.json();

    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApp();
    }

    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    rtdb = getDatabase(app);
    functions = getFunctions(app);

    // 3. INICIALIZAR o messaging apenas no navegador
    if (typeof window !== 'undefined') {
      messaging = getMessaging(app);
    }
    
    firebaseInitialized = true;
  } catch (error) {
    console.error("Erro detalhado ao inicializar o Firebase:", error);
    // Propaga o erro para que os hooks saibam que a inicialização falhou
    throw error;
  }
};

// Hook para garantir que a inicialização seja concluída
export const ensureFirebaseInitialized = async () => {
  if (!firebaseInitialized) {
    await initializeFirebase();
  }
};

// Retorna todas as instâncias inicializadas
export const getFirebaseInstances = () => {
  if (!firebaseInitialized) {
    throw new Error("Firebase não foi inicializado. Chame ensureFirebaseInitialized() primeiro.");
  }
  return {
    app,
    db,
    auth,
    storage,
    rtdb,
    functions,
    // 4. RETORNAR a instância de messaging
    messaging,
  };
};
