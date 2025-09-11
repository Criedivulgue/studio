'use client';

import { db } from '@/lib/firebase';
import { doc, getDoc, updateDoc, PartialWithFieldValue } from 'firebase/firestore';
import type { PlatformUser, User } from '@/lib/types';

// As funções getSuperAdmin e getSuperAdminUid foram removidas, pois eram os
// resquícios da arquitetura antiga que causavam o erro de permissão no Firestore,
// travando a aplicação na tela de carregamento.

/**
 * Busca os dados completos de um usuário (seja admin ou superadmin) usando seu UID.
 * Esta função é segura pois só busca dados quando solicitada, e o controle de permissão
 * para a sua execução é feito pelas Regras do Firestore.
 * @param uid O UID do usuário a ser buscado (Firebase Auth UID).
 * @returns {Promise<User | null>} O objeto completo do usuário ou null se não for encontrado.
 */
export async function getUserData(uid: string): Promise<User | null> {
    if (!uid) return null;
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            console.warn(`Nenhum usuário encontrado com o UID: ${uid}`);
            return null;
        }
        return { id: userDoc.id, ...userDoc.data() } as User;
    } catch (error) {
        console.error(`Erro ao buscar dados do usuário com UID: ${uid}`, error);
        // Retornar null em caso de erro previne que a aplicação quebre,
        // o que é essencial para o fluxo de autenticação.
        return null;
    }
}

/**
 * Atualiza as configurações de um usuário no Firestore.
 * @param userId O ID do usuário a ser atualizado.
 * @param settings Um objeto com as configurações a serem atualizadas.
 */
export async function updateUserSettings(userId: string, settings: Partial<PlatformUser>): Promise<void> {
  if (!userId) throw new Error("ID do usuário não fornecido para atualização.");

  const userDocRef = doc(db, 'users', userId);
  
  // O tipo PartialWithFieldValue<T> do Firebase é mais preciso para operações de atualização
  const settingsToUpdate: PartialWithFieldValue<PlatformUser> = settings;

  await updateDoc(userDocRef, settingsToUpdate);
}
