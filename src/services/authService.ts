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
 * Verifica se já existe um Super Administrador no sistema.
 * @returns {Promise<boolean>} True se existir, false caso contrário.
 */
export async function checkSuperAdminExists(): Promise<boolean> {
  const superAdminRef = doc(db, "users", "super-admin");
  const docSnap = await getDoc(superAdminRef);
  return docSnap.exists();
}

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

  // Se for o Super Admin, usamos um ID fixo para facilitar a verificação.
  // Caso contrário, usamos o UID gerado pelo Firebase.
  const userId = role === 'Super Admin' ? 'super-admin' : firebaseUser.uid;

  const newUser: User = {
    id: userId,
    name,
    email: firebaseUser.email!,
    role,
    avatar: `https://picsum.photos/seed/${firebaseUser.uid}/40/40`,
  };

  // Salva as informações do usuário no Firestore com o ID correto.
  await setDoc(doc(db, "users", userId), newUser);
  
  // Se for um novo admin (não super-admin), também mantemos o documento com o UID original
  // para referência futura, se necessário, embora o principal seja o com ID customizado.
  if (role !== 'Super Admin') {
      await setDoc(doc(db, "users", firebaseUser.uid), newUser);
  }
  
  return newUser;
}

/**
 * Autentica um usuário com email e senha.
 * @param email O email do usuário.
 * @param password A senha do usuário.
 * @returns O objeto do usuário do Firestore.
 */
export async function signIn(email: string, password:string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    // Após o login, precisamos descobrir se o usuário logado é o Super Admin ou um Admin comum.
    // Primeiro, checamos se ele é o Super Admin.
    const superAdminRef = doc(db, "users", "super-admin");
    const superAdminSnap = await getDoc(superAdminRef);

    if (superAdminSnap.exists() && superAdminSnap.data().email === email) {
        return superAdminSnap.data() as User;
    }

    // Se não for o super-admin, busca pelo UID.
    const user = await getCurrentUserByUid(userCredential.user.uid);
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
 * Obtém os dados do usuário atualmente logado do Firestore pelo seu UID.
 * @returns O objeto do usuário ou null se não estiver logado.
 */
export async function getCurrentUserByUid(uid: string): Promise<User | null> {
  const userDocRef = doc(db, "users", uid);
  const userDocSnap = await getDoc(userDocRef);

  if (userDocSnap.exists()) {
    return userDocSnap.data() as User;
  } else {
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
      // Aqui, a lógica de descoberta de função (Super Admin vs Admin) precisaria ser replicada
      // para garantir que o objeto de usuário correto seja retornado.
      const superAdminRef = doc(db, "users", "super-admin");
      const superAdminSnap = await getDoc(superAdminRef);
      if (superAdminSnap.exists() && superAdminSnap.data().email === firebaseUser.email) {
          callback(superAdminSnap.data() as User);
      } else {
          const user = await getCurrentUserByUid(firebaseUser.uid);
          callback(user);
      }
    } else {
      callback(null);
    }
  });
}
