import { auth, db } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, deleteField, collection, query, where, getDocs } from 'firebase/firestore';
import type { User, UserRole } from '@/lib/types';

// Função para verificar se o superadmin já existe.
export async function checkSuperAdminExists(): Promise<boolean> {
  const q = query(collection(db, "users"), where("role", "==", "superadmin"));
  const querySnapshot = await getDocs(q);
  return !querySnapshot.empty;
}

// Função de cadastro de usuário
export async function signUp(email: string, password: string, name: string, role: UserRole = 'admin'): Promise<User> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  const newUser: User = {
    id: firebaseUser.uid,
    name,
    email: firebaseUser.email!,
    role,
    avatar: `https://i.pravatar.cc/40?u=${firebaseUser.uid}`,
    createdAt: new Date(),
  };

  await setDoc(doc(db, "users", firebaseUser.uid), newUser);
  return newUser;
}

// Função de login
export async function signIn(email: string, password:string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = await getUserProfile(userCredential.user.uid);
    if (!user) {
        throw new Error('Perfil do usuário não encontrado no Firestore.');
    }
    return user;
}

// Função de logout
export async function logout(): Promise<void> {
  const uid = auth.currentUser?.uid;
  if (uid) {
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, { fcmToken: deleteField() });
    } catch (error) {
      console.error("Falha ao remover o token FCM durante o logout:", error);
    }
  }
  await signOut(auth);
}

/**
 * A FUNÇÃO CORRETA E CENTRALIZADA PARA BUSCAR DADOS DO USUÁRIO.
 * Busca os dados do perfil de um usuário na coleção "users".
 * @param uid O ID do usuário (Firebase Auth UID).
 * @returns O perfil do usuário ou null se não for encontrado.
 */
export async function getUserProfile(uid: string): Promise<User | null> {
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return { id: userDocSnap.id, ...userDocSnap.data() } as User;
  }
  return null;
}

/**
 * O OBSERVADOR DE AUTENTICAÇÃO CORRIGIDO E ROBUSTO.
 * Ouve as mudanças no estado de autenticação do Firebase e busca o perfil do usuário.
 * AGORA INCLUI UM BLOCO TRY/CATCH para garantir que a aplicação não trave em um
 * estado de loading infinito caso a busca do perfil falhe.
 */
export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        // Tenta buscar o perfil customizado do usuário.
        const appUser = await getUserProfile(firebaseUser.uid);
        callback(appUser);
      } catch (error) {
        // SE A BUSCA FALHAR (ex: erro de permissão no Firestore, rede, etc):
        console.error("Falha catastrófica ao buscar perfil do usuário no onAuthChange:", error);
        // Informa à aplicação que a autenticação falhou, liberando a tela de loading.
        callback(null);
      }
    } else {
      // Se o usuário deslogar, limpamos os dados.
      callback(null);
    }
  });
}
