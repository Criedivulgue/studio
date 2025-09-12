
import { getApp, getApps, initializeApp, cert, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';

// Interface para tipar as instâncias do Admin SDK
interface AdminInstances {
  app: App;
  db: Firestore;
  auth: Auth;
}

// Variável para armazenar as instâncias em cache (padrão Singleton)
let instances: AdminInstances | null = null;

/**
 * Tenta decodificar a chave da conta de serviço. 
 * Primeiro tenta como Base64 (comum em ambientes de deploy como Vercel),
 * depois como JSON puro.
 */
function parseServiceAccount(): object {
  const serviceAccountKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('A variável de ambiente FIREBASE_SERVICE_ACCOUNT_KEY não está definida.');
  }

  try {
    // Tenta decodificar como Base64
    const decodedKey = Buffer.from(serviceAccountKey, 'base64').toString('utf-8');
    return JSON.parse(decodedKey);
  } catch (e) {
    // Se falhar, tenta interpretar como JSON puro
    try {
      return JSON.parse(serviceAccountKey);
    } catch (error) {
      throw new Error('Falha ao interpretar a FIREBASE_SERVICE_ACCOUNT_KEY. A chave não é um JSON válido nem uma string Base64 válida.');
    }
  }
}

/**
 * Inicializa o Firebase Admin SDK se ainda não foi inicializado.
 * @returns Um objeto contendo as instâncias do app e do auth do admin.
 */
function initializeAdminApp(): AdminInstances {
  const serviceAccount = parseServiceAccount();

  // Pega o app existente ou inicializa um novo
  const app = getApps().length
    ? getApp()
    : initializeApp({ credential: cert(serviceAccount) });

  return {
    app,
    db: getFirestore(app),
    auth: getAuth(app),
  };
}

/**
 * Ponto de acesso Singleton para as instâncias do Firebase Admin.
 * Garante que a inicialização ocorra apenas uma vez.
 * 
 * NUNCA MAIS EXPORTE AS INSTÂNCIAS DIRETAMENTE. USE ESTA FUNÇÃO.
 * @returns As instâncias do Admin SDK (app, auth, db).
 */
export function getAdminInstances(): AdminInstances {
  if (!instances) {
    instances = initializeAdminApp();
  }
  return instances;
}
