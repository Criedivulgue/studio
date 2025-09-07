import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface AiConfig {
  useCustomInformation: boolean;
  customInstructions: string;
}

const CONFIG_COLLECTION = "ai-configs";

/**
 * Salva a configuração de IA para um administrador específico.
 * @param adminUid O ID do administrador.
 * @param config O objeto de configuração a ser salvo.
 */
export async function saveAiConfig(adminUid: string, config: AiConfig): Promise<void> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, adminUid);
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar a configuração de IA:", error);
    throw new Error("Não foi possível salvar a configuração de IA.");
  }
}

/**
 * Obtém a configuração de IA para um administrador específico.
 * Retorna a configuração padrão (super-admin) se nenhuma configuração específica for encontrada.
 * @param adminUid O ID do administrador.
 * @returns A configuração de IA.
 */
export async function getAiConfig(adminUid: string): Promise<AiConfig> {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, adminUid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AiConfig;
    } else {
      // Se o admin não tiver config, tente buscar a do super-admin como padrão
      if (adminUid !== 'super-admin') {
        const superAdminRef = doc(db, CONFIG_COLLECTION, 'super-admin');
        const superAdminSnap = await getDoc(superAdminRef);
        if (superAdminSnap.exists()) {
          return superAdminSnap.data() as AiConfig;
        }
      }
      // Retorna um padrão se nada for encontrado
      return {
        useCustomInformation: true,
        customInstructions: "Você é um assistente prestativo da OmniFlow AI.",
      };
    }
  } catch (error) {
    console.error("Erro ao obter a configuração de IA:", error);
    throw new Error("Não foi possível carregar a configuração de IA.");
  }
}
