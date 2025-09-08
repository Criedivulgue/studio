import { db } from "@/lib/firebase";
import { doc, updateDoc, getDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import type { User } from "@/lib/types";

/**
 * Busca os grupos de contatos personalizados de um usuário específico.
 * @param userId - O ID do usuário (administrador).
 * @returns Uma promessa que resolve para um array de strings (os nomes dos grupos).
 */
export async function getContactGroups(userId: string): Promise<string[]> {
  try {
    const userDocRef = doc(db, "users", userId);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists()) {
      const userData = userDoc.data() as User;
      // Retorna os grupos do usuário ou um array vazio se não houver.
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
 * @param userId - O ID do usuário (administrador).
 * @param newGroup - O nome do novo grupo a ser adicionado.
 */
export async function addContactGroup(userId: string, newGroup: string): Promise<void> {
  if (!newGroup || !newGroup.trim()) {
    throw new Error("O nome do grupo não pode estar vazio.");
  }
  try {
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
 * @param userId - O ID do usuário (administrador).
 * @param groupToRemove - O nome do grupo a ser removido.
 */
export async function removeContactGroup(userId: string, groupToRemove: string): Promise<void> {
  try {
    const userDocRef = doc(db, "users", userId);
    await updateDoc(userDocRef, {
      contactGroups: arrayRemove(groupToRemove),
    });
    // TODO: Considerar o que acontece com os contatos que pertenciam a este grupo.
    // Uma função de atualização em lote poderia ser necessária aqui no futuro.
  } catch (error) {
    console.error("Erro ao remover grupo: ", error);
    throw new Error("Falha ao remover o grupo.");
  }
}

/**
 * Renomeia um grupo de contatos existente.
 * Isso requer ler, modificar e reescrever o array de grupos.
 * @param userId - O ID do usuário (administrador).
 * @param oldName - O nome atual do grupo.
 * @param newName - O novo nome para o grupo.
 */
export async function renameContactGroup(userId: string, oldName: string, newName: string): Promise<void> {
  if (!newName || !newName.trim()) {
    throw new Error("O novo nome do grupo não pode estar vazio.");
  }

  try {
    const userDocRef = doc(db, "users", userId);
    const currentGroups = await getContactGroups(userId);

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

     // TODO: Seria ideal também atualizar todos os contatos que usam `oldName` para `newName`.

  } catch (error) {
    console.error("Erro ao renomear grupo: ", error);
    // Repassa a mensagem de erro original, se for o caso de grupo duplicado.
    if (error instanceof Error) {
        throw error;
    }
    throw new Error("Falha ao renomear o grupo.");
  }
}
