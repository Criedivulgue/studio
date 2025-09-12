import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
// CORREÇÃO: Importa as novas funções de inicialização
import { ensureFirebaseInitialized, getFirebaseInstances } from "@/lib/firebase";
import type { PlatformUser } from "@/lib/types";

/**
 * Busca os grupos de contatos personalizados de um usuário específico.
 */
export async function getContactGroups(userId: string): Promise<string[]> {
  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as PlatformUser;
      return userData.contactGroups || [];
    }
    console.warn(`Nenhum usuário encontrado com o ID: ${userId}`);
    return [];
  } catch (error) {
    console.error("Erro ao buscar grupos de contatos: ", error);
    throw new Error("Falha ao buscar os grupos do banco de dados.");
  }
}

/**
 * Adiciona um novo grupo de contatos à lista de um usuário.
 */
export async function addContactGroup(userId: string, newGroup: string): Promise<void> {
  if (!newGroup || !newGroup.trim()) {
    throw new Error("O nome do grupo não pode estar vazio.");
  }
  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      contactGroups: arrayUnion(newGroup.trim()),
    });
  } catch (error) {
    console.error("Erro ao adicionar novo grupo: ", error);
    throw new Error("Falha ao salvar o novo grupo.");
  }
}

/**
 * Remove um grupo de contatos da lista de um usuário.
 */
export async function removeContactGroup(userId: string, groupToRemove: string): Promise<void> {
  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      contactGroups: arrayRemove(groupToRemove),
    });
  } catch (error) {
    console.error("Erro ao remover grupo: ", error);
    throw new Error("Falha ao remover o grupo.");
  }
}

/**
 * Renomeia um grupo de contatos existente.
 */
export async function renameContactGroup(userId: string, oldName: string, newName: string): Promise<void> {
  if (!newName || !newName.trim()) {
    throw new Error("O novo nome do grupo não pode estar vazio.");
  }

  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const userDocRef = doc(db, "users", userId);
    const docSnap = await getDoc(userDocRef);

    if (!docSnap.exists()) {
        throw new Error(`Usuário com ID ${userId} não encontrado.`);
    }

    const userData = docSnap.data() as PlatformUser;
    const currentGroups = userData.contactGroups || [];

    if (currentGroups.includes(newName.trim())) {
        throw new Error(`O grupo "${newName.trim()}" já existe.`);
    }

    const groupIndex = currentGroups.indexOf(oldName);
    if (groupIndex === -1) {
      throw new Error(`O grupo "${oldName}" não foi encontrado.`);
    }

    currentGroups[groupIndex] = newName.trim();

    await updateDoc(userDocRef, {
      contactGroups: currentGroups,
    });

  } catch (error) {
    console.error("Erro ao renomear grupo: ", error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Falha ao renomear o grupo.");
  }
}
