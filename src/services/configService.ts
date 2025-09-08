import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// A interface que define a estrutura de um objeto de configuração de IA.
export interface AiConfig {
  useCustomInformation: boolean;
  customInstructions: string;
}

// O nome da subcoleção onde as configurações são armazenadas DENTRO de um usuário.
const CONFIG_SUBCOLLECTION = "ai-configs";

/**
 * Salva ou atualiza a configuração de IA para um UID de usuário específico.
 * A função agora constrói o caminho para a subcoleção correta: /users/{uid}/ai-configs/{uid}
 * @param uid O ID do usuário (admin ou super-admin).
 * @param config O objeto de configuração a ser salvo.
 */
export async function saveAiConfig(uid: string, config: AiConfig): Promise<void> {
  try {
    // CORREÇÃO: O caminho do documento agora aponta para a subcoleção.
    const docRef = doc(db, "users", uid, CONFIG_SUBCOLLECTION, uid);
    await setDoc(docRef, config, { merge: true });
  } catch (error) {
    console.error("Erro ao salvar a configuração de IA:", error);
    throw new Error("Não foi possível salvar a configuração de IA.");
  }
}

/**
 * Obtém a configuração de IA para um UID de usuário específico.
 * A função agora busca a configuração na subcoleção correta: /users/{uid}/ai-configs/{uid}
 * @param uid O ID do usuário (admin ou super-admin).
 * @returns A configuração de IA do usuário ou uma configuração padrão.
 */
export async function getAiConfig(uid: string): Promise<AiConfig> {
  try {
    // CORREÇÃO: O caminho do documento agora aponta para a subcoleção.
    const docRef = doc(db, "users", uid, CONFIG_SUBCOLLECTION, uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as AiConfig;
    } else {
      // Retorna uma configuração padrão se nenhuma for encontrada.
      return {
        useCustomInformation: true,
        customInstructions: "",
      };
    }
  } catch (error) {
    console.error("Erro ao obter a configuração de IA:", error);
    // Em caso de erro (como permissão), loga o erro e retorna um padrão seguro.
    throw error; // Lança o erro para que a UI possa tratá-lo.
  }
}
