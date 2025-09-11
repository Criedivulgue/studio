import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

// Interface que define a estrutura da configuração de IA no documento do usuário.
export interface AiConfig {
  useCustomInfo?: boolean;
  aiPrompt?: string;
}

/**
 * Salva ou atualiza a configuração de IA diretamente no documento do usuário.
 * Usa 'updateDoc' para modificar apenas os campos de IA, preservando o resto do documento.
 * @param uid O ID do usuário (admin ou super-admin).
 * @param config O objeto de configuração a ser salvo (pode ser parcial, ex: { aiPrompt: "novo prompt" }).
 */
export async function saveAiConfig(uid: string, config: Partial<AiConfig>): Promise<void> {
  try {
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
 * @param uid O ID do usuário (admin ou super-admin).
 * @returns A configuração de IA do usuário ou uma configuração padrão segura.
 */
export async function getAiConfig(uid: string): Promise<AiConfig> {
  try {
    const userRef = doc(db, "users", uid);
    const docSnap = await getDoc(userRef);

    if (docSnap.exists()) {
      const userData = docSnap.data();
      // Retorna os campos de IA, com padrões para garantir que não sejam nulos.
      return {
        useCustomInfo: userData.useCustomInfo ?? true,
        aiPrompt: userData.aiPrompt || "", // Retorna string vazia se nulo
      };
    } else {
      // Padrão seguro se o usuário não for encontrado.
      console.warn(`Usuário ${uid} não encontrado. Retornando config de IA padrão.`);
      return {
        useCustomInfo: true,
        aiPrompt: "",
      };
    }
  } catch (error) {
    console.error("Erro ao obter a configuração de IA:", error);
    throw error; // Lança o erro para a UI tratar.
  }
}
