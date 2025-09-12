'use client';

// CORREÇÃO: Importa as novas funções de inicialização
import { ensureFirebaseInitialized, getFirebaseInstances } from '@/lib/firebase';
import { doc, getDoc, updateDoc, PartialWithFieldValue } from 'firebase/firestore';
import type { PlatformUser } from '@/lib/types';

/**
 * Busca os dados completos de um usuário (seja admin ou superadmin) usando seu UID.
 */
export async function getUserData(uid: string): Promise<PlatformUser | null> {
    if (!uid) return null;
    try {
        // CORREÇÃO: Garante a inicialização e obtém a instância do DB
        await ensureFirebaseInitialized();
        const { db } = getFirebaseInstances();

        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.warn(`Nenhum usuário encontrado com o UID: ${uid}`);
            return null;
        }
        return { id: userDoc.id, ...userDoc.data() } as PlatformUser;
    } catch (error) {
        console.error(`Erro ao buscar dados do usuário com UID: ${uid}`, error);
        return null;
    }
}

/**
 * Atualiza as configurações de um usuário no Firestore.
 */
export async function updateUserSettings(userId: string, settings: Partial<PlatformUser>): Promise<void> {
  if (!userId) throw new Error("ID do usuário não fornecido para atualização.");
  
  // CORREÇÃO: Garante a inicialização e obtém a instância do DB
  await ensureFirebaseInitialized();
  const { db } = getFirebaseInstances();

  const userDocRef = doc(db, 'users', userId);
  const settingsToUpdate: PartialWithFieldValue<PlatformUser> = settings;

  await updateDoc(userDocRef, settingsToUpdate);
}
