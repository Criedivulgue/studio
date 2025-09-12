import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";

/**
 * Define a estrutura de dados para a criação de um novo contato.
 * Esta é a "carga" que a UI deve enviar para o serviço.
 */
export type NewContactPayload = {
  name: string;
  ownerId: string;
  whatsapp: string;
  email?: string | null;
  phone?: string | null;
  interesses?: string[];
  groupId?: string | null;
};

/**
 * Cria um novo contato no banco de dados com valores padrão.
 * @param payload - Os dados do novo contato, validados pelo tipo NewContactPayload.
 * @returns O ID do contato recém-criado.
 */
export async function createContact(payload: NewContactPayload): Promise<string> {
  try {
    const contactDocRef = await addDoc(collection(db, "contacts"), {
      ...payload,
      // Valores padrão definidos pelo serviço para garantir consistência
      status: 'active', 
      createdAt: serverTimestamp(),
      lastInteraction: serverTimestamp(),
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
    const contactRef = doc(db, 'contacts', contactId);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error("Erro ao deletar contato: ", error);
    throw new Error("Falha ao deletar o contato.");
  }
}
