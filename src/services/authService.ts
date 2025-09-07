import { auth, db } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import type { User } from '@/lib/types';

/**
 * Cria um novo usuário com email e senha e salva seus dados no Firestore.
 * @param email O email do usuário.
 * @param password A senha do usuário.
 * @param name O nome do usuário.
 * @param role A função do usuário ('Admin' ou 'Super Admin').
 */
export async function signUp(email: string, password: string, name: string, role: 'Admin' | 'Super Admin' = 'Admin'): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  const newUser: User = {
    id: firebaseUser.uid,
    name,
    email: firebaseUser.email!,
    role,
    avatar: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
  };

  // Salva as informações do usuário no Firestore
  await setDoc(doc(db, "users", firebaseUser.uid), newUser);
  
  return newUser;
}

/**
 * Autentica um usuário com email e senha.
 * @param email O email do usuário.
 * @param password A senha do usuário.
 * @returns O objeto do usuário do Firestore.
 */
export async function signIn(email: string, password: string): Promise<User> {
  await signInWithEmailAndPassword(auth, email, password);
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Usuário não encontrado no Firestore após o login.');
  }
  return user;
}

/**
 * Desloga o usuário atual.
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Obtém os dados do usuário atualmente logado do Firestore.
 * @returns O objeto do usuário ou null se não estiver logado.
 */
export async function getCurrentUser(): Promise<User | null> {
  const firebaseUser = auth.currentUser;
  if (!firebaseUser) {
    return null;
  }
  const userDocRef = doc(db, "users", firebaseUser.uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as User;
  } else {
    // Isso pode acontecer se o registro do usuário no firestore falhar
    console.warn("Usuário autenticado mas não encontrado no Firestore.");
    return null;
  }
}

/**
 * Observa as mudanças no estado de autenticação.
 * @param callback A função a ser chamada quando o estado mudar.
 * @returns A função para cancelar a inscrição.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      const user = await getCurrentUser();
      callback(user);
    } else {
      callback(null);
    }
  });
}
