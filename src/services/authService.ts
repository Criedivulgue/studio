import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

// 1. Importar as NOVAS funções de inicialização
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { PlatformUser } from "@/lib/types";

// --- FUNÇÕES DE SERVIÇO DE AUTENTICAÇÃO ATUALIZADAS ---

/**
 * Registra um novo usuário com e-mail e senha.
 */
export const register = async (name: string, email: string, pass: string): Promise<PlatformUser> => {
  // 2. Garante a inicialização e obtém as instâncias
  await ensureFirebaseInitialized();
  const { auth, db } = getFirebaseInstances();

  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  const newUser: Omit<PlatformUser, 'id'> = {
    email: user.email!,
    name: name,
    role: 'user', // Por padrão, o papel é 'user'
    status: 'active', // Por padrão, o status é 'active'
    whatsapp: '', // Opcional, pode ser preenchido depois
    createdAt: serverTimestamp(),
  };

  await setDoc(doc(db, "users", user.uid), newUser);

  return { id: user.uid, ...newUser };
};

/**
 * Autentica um usuário com e-mail e senha.
 */
export const login = async (email: string, pass: string): Promise<PlatformUser> => {
  await ensureFirebaseInitialized();
  const { auth, db } = getFirebaseInstances();

  const userCredential = await signInWithEmailAndPassword(auth, email, pass);
  const user = userCredential.user;

  const userDoc = await getDoc(doc(db, "users", user.uid));
  if (!userDoc.exists()) {
    throw new Error("Dados do usuário não encontrados no Firestore.");
  }

  return { id: user.uid, ...userDoc.data() } as PlatformUser;
};

/**
 * Realiza o logout do usuário.
 */
export const logout = async (): Promise<void> => {
  await ensureFirebaseInitialized();
  const { auth } = getFirebaseInstances();
  await signOut(auth);
};

/**
 * Envia um e-mail para redefinição de senha.
 */
export const resetPassword = async (email: string): Promise<void> => {
  await ensureFirebaseInitialized();
  const { auth } = getFirebaseInstances();
  await sendPasswordResetEmail(auth, email);
};

/**
 * Autentica um usuário com o provedor do Google.
 */
export const signInWithGoogle = async (): Promise<PlatformUser> => {
  await ensureFirebaseInitialized();
  const { auth, db } = getFirebaseInstances();

  const provider = new GoogleAuthProvider();
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Verifica se o usuário já existe no Firestore
  const userDocRef = doc(db, "users", user.uid);
  const userDoc = await getDoc(userDocRef);

  if (!userDoc.exists()) {
    // Se não existir, cria um novo registro de usuário
    const newUser: Omit<PlatformUser, 'id'> = {
      email: user.email!,
      name: user.displayName || "Usuário Google",
      role: 'user',
      status: 'active',
      whatsapp: user.phoneNumber || '',
      createdAt: serverTimestamp(),
    };
    await setDoc(userDocRef, newUser);
    return { id: user.uid, ...newUser };
  } else {
    // Se já existir, apenas retorna os dados existentes
    return { id: user.uid, ...userDoc.data() } as PlatformUser;
  }
};
