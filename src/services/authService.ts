import {
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { doc, getDoc, setDoc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
// CORREÇÃO: Importando PlatformUser e removendo User não utilizado
import type { PlatformUser, UserRole, PublicProfile } from '@/lib/types';

/**
 * Inscreve um novo usuário, determinando sua função e criando seus documentos.
 */
// CORREÇÃO: Retornando PlatformUser e usando os novos tipos
export async function signUp(email: string, password: string, name: string): Promise<PlatformUser> {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;

  const appStatusRef = doc(db, 'config', 'app_status');
  const userRef = doc(db, 'users', firebaseUser.uid);
  const publicProfileRef = doc(db, 'public_profiles', firebaseUser.uid);

  try {
    // A transação garante que a criação do usuário e a verificação de status sejam atômicas
    const determinedRole = await runTransaction(db, async (transaction) => {
      const appStatusDoc = await transaction.get(appStatusRef);
      let role: UserRole;

      if (!appStatusDoc.exists() || !appStatusDoc.data().initialized) {
        role = 'superadmin';
        // CORREÇÃO: Usando a nomenclatura 'superAdminId'
        transaction.set(appStatusRef, { initialized: true, superAdminId: firebaseUser.uid });
      } else {
        role = 'admin';
      }
      
      // CORREÇÃO: Criando um objeto que corresponde a PlatformUser (sem o id, que é a chave do doc)
      const newUserForDb: Omit<PlatformUser, 'id'> = {
        name,
        email: firebaseUser.email!,
        role,
        createdAt: new Date(), // Usando new Date() para consistência com o código antigo
        status: 'active',
        whatsapp: '',
        // Propriedades opcionais podem ser omitidas
      };

      const newPublicProfile: PublicProfile = {
        displayName: name, 
        avatarUrl: '',     
        greeting: 'Olá! Como posso ajudar hoje?',
        // CORREÇÃO: Usando o uid do firebaseUser como ownerId
        ownerId: firebaseUser.uid,
      };

      transaction.set(userRef, newUserForDb);
      transaction.set(publicProfileRef, newPublicProfile);

      return role;
    });

    // CORREÇÃO: Construindo e retornando o objeto PlatformUser completo
    const newUser: PlatformUser = {
      id: firebaseUser.uid,
      email: firebaseUser.email!,
      name,
      role: determinedRole,
      createdAt: new Date(),
      status: 'active',
      whatsapp: '',
    };
    
    return newUser;

  } catch (error) {
    console.error('Falha na transação de cadastro:', error);
    // É uma boa prática relançar o erro para que a UI possa reagir
    throw new Error('Falha ao criar o usuário e seu perfil no banco de dados.');
  }
}

/**
 * Autentica um usuário existente.
 */
export async function signIn(email: string, password: string): Promise<FirebaseUser> {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Desconecta o usuário atual.
 */
export async function logout(): Promise<void> {
  await signOut(auth);
}

/**
 * Observador de estado de autenticação.
 * Passa o usuário bruto do Firebase para o callback.
 */
export function onAuthChange(callback: (user: FirebaseUser | null) => void): () => void {
  return onAuthStateChanged(auth, (firebaseUser) => {
    callback(firebaseUser);
  });
}

/**
 * Busca o perfil de usuário do Firestore.
 */
// CORREÇÃO: Retornando Promise<PlatformUser | null>
export async function getUserProfile(uid: string): Promise<PlatformUser | null> {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const data = userSnap.data();
    // CORREÇÃO: Construindo e retornando um objeto PlatformUser completo
    return {
        id: userSnap.id,
        email: data.email,
        name: data.name,
        role: data.role,
        createdAt: data.createdAt,
        status: data.status,
        whatsapp: data.whatsapp,
        // Garantir que as propriedades opcionais existam ou sejam nulas
        aiPrompt: data.aiPrompt || '',
        contactGroups: data.contactGroups || [],
    } as PlatformUser;
  }
  return null;
}
