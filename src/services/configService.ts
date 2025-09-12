import { doc, getDoc, updateDoc } from "firebase/firestore";
// CORREÇÃO: Importa as novas funções de inicialização
import { ensureFirebaseInitialized, getFirebaseInstances } from "@/lib/firebase";

// Interface que define a estrutura da configuração de IA no documento do usuário.
export interface AiConfig {
  useCustomInfo?: boolean;
  aiPrompt?: string;
}

/**
 * Salva ou atualiza a configuração de IA diretamente no documento do usuário.
 */
export async function saveAiConfig(uid: string, config: Partial<AiConfig>): Promise<void> {
  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const userRef = doc(db, "users", uid);
    await updateDoc(userRef, config);
    console.log(`Configuração de IA atualizada para o usuário: ${uid}`);
  } catch (error) {
    console.error("Erro ao salvar a configuração de IA:", error);
    throw new Error("Não foi possível salvar a configuração de IA.");
  }
}

/**
 * Obtém a configuração de IA diretamente do documento do usuário.
 */
export async function getAiConfig(uid: string): Promise<AiConfig> {
  try {
    // CORREÇÃO: Garante a inicialização e obtém a instância do DB
    await ensureFirebaseInitialized();
    const { db } = getFirebaseInstances();

    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      return {
        useCustomInfo: userData.useCustomInfo ?? true,
        aiPrompt: userData.aiPrompt || "",
      };
    } else {
      console.warn(`Usuário ${uid} não encontrado. Retornando config de IA padrão.`);
      return {
        useCustomInfo: true,
        aiPrompt: "",
      };
    }
  } catch (error) {
    console.error("Erro ao obter a configuração de IA:", error);
    throw error;
  }
}
