import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, deleteDoc } from "firebase/firestore";
// CORREÇÃO: Importa as novas funções de inicialização
import { ensureFirebaseInitialized, getFirebaseInstances } from "@/lib/firebase";

/**
 * Define a estrutura de dados para a criação de um novo contato.
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
 */
export async function createContact(payload: NewContactPayload): Promise<string> {
  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const contactDocRef = await addDoc(collection(db, "contacts"), {
      ...payload,
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
 */
export async function getContactGroups(adminUid: string): Promise<string[]> {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

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
 */
export async function deleteContact(contactId: string): Promise<void> {
  if (!contactId) {
    throw new Error('O ID do contato é obrigatório para a exclusão.');
  }
  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const contactRef = doc(db, 'contacts', contactId);
    await deleteDoc(contactRef);
  } catch (error) {
    console.error("Erro ao deletar contato: ", error);
    throw new Error("Falha ao deletar o contato.");
  }
}
