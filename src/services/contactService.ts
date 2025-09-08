import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, query, where, getDocs, doc, setDoc } from "firebase/firestore";
import type { Contact } from "@/lib/types";

// ATUALIZADO: Reflete o Modelo de Dados Canônico
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
 * Cria um novo contato e a conversa inicial associada a ele.
 * @param contactData - Os dados do novo contato.
 * @returns O ID do contato recém-criado.
 */
export async function createContact(contactData: NewContactPayload): Promise<string> {
  try {
    // Passo 1: Salvar o novo contato na coleção principal 'contacts'
    const contactDocRef = await addDoc(collection(db, "contacts"), {
      ...contactData,
      createdAt: serverTimestamp(),
    });

    // Passo 2: Criar o documento de conversa inicial
    const conversationRef = doc(db, `users/${contactData.ownerId}/conversations`, contactDocRef.id);
    await setDoc(conversationRef, {
      name: contactData.name,
      lastMessage: "Inicie a conversa!",
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: 0,
      contactId: contactDocRef.id
    });

    return contactDocRef.id;
  } catch (error) {
    console.error("Erro ao criar contato e conversa inicial: ", error);
    throw new Error("Falha ao salvar o contato e iniciar a conversa no banco de dados.");
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
        if (data.group) { // Esta lógica pode precisar de ajuste ou ser removida
            groups.add(data.group);
        }
    });
    return Array.from(groups);
}
