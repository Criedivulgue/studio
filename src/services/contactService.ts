import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
import type { Contact } from "@/lib/types";

// Definição do payload para criar um novo contato.
export type NewContactPayload = {
  name: string;
  email: string;
  whatsapp: string;
  phone: string;
  status: 'active' | 'inactive';
  interesses: string[];
  ownerId: string;
};

/**
 * Cria um novo contato no banco de dados.
 * @param contactData - Os dados do novo contato, incluindo o ownerId (o admin).
 * @returns O ID do contato recém-criado.
 */
export async function createContact(contactData: NewContactPayload): Promise<string> {
  try {
    const contactDocRef = await addDoc(collection(db, "contacts"), {
      ...contactData,
      createdAt: serverTimestamp(),
    });
    return contactDocRef.id;
  } catch (error) {
    console.error("Erro ao criar contato: ", error);
    throw new Error("Falha ao salvar o contato no banco de dados.");
  }
}

/**
 * Busca todos os grupos de contato únicos para um determinado administrador.
 * @param adminUid O UID do administrador.
 * @returns Uma array de strings com os nomes dos grupos.
 */
export async function getContactGroups(adminUid: string): Promise<string[]> {
    const q = query(collection(db, "contacts"), where("ownerId", "==", adminUid));
    const querySnapshot = await getDocs(q);
    const groups = new Set<string>();
    querySnapshot.forEach(doc => {
        const data = doc.data();
        if (data.group) {
            groups.add(data.group);
        }
    });
    return Array.from(groups);
}

/**
 * Deleta um contato do banco de dados.
 * @param contactId O ID do contato a ser deletado.
 * @throws Lança um erro se a exclusão falhar.
 */
export async function deleteContact(contactId: string): Promise<void> {
  if (!contactId) {
    throw new Error('O ID do contato é obrigatório para a exclusão.');
  }
  try {
    // O caminho correto para os contatos é na coleção 'contacts'
    const contactRef = doc(db, 'contacts', contactId);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error("Erro ao deletar contato: ", error);
    throw new Error("Falha ao deletar o contato.");
  }
}
