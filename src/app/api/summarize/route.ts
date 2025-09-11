'use server';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, orderBy, query, DocumentData } from 'firebase/firestore';

// Inicialização do Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-pro"});

/**
 * Lida com requisições POST para gerar uma SUGESTÃO DE RESPOSTA para uma conversa em tempo real.
 * A lógica agora combina as configurações de IA global e pessoal.
 */
export async function POST(req: NextRequest) {
  try {
    // O request agora precisa enviar o adminId e o caminho da conversa
    const { conversationPath, adminId } = await req.json();

    if (!conversationPath || typeof conversationPath !== 'string') {
      return NextResponse.json({ error: 'O caminho da conversa (conversationPath) é obrigatório.' }, { status: 400 });
    }
    if (!adminId || typeof adminId !== 'string') {
        return NextResponse.json({ error: 'O ID do administrador (adminId) é obrigatório.' }, { status: 400 });
    }

    // 1. Buscar o prompt Global
    const globalSettingsRef = doc(db, "system_settings", "ai_global");
    const globalSettingsDoc = await getDoc(globalSettingsRef);
    const globalPrompt = globalSettingsDoc.exists() ? globalSettingsDoc.data().prompt : "Você é um assistente de atendimento.";

    // 2. Buscar o prompt Pessoal do admin
    const adminUserRef = doc(db, "users", adminId);
    const adminUserDoc = await getDoc(adminUserRef);
    const personalPrompt = adminUserDoc.exists() ? adminUserDoc.data().aiPrompt : "";

    // 3. Buscar o histórico de mensagens
    const messagesRef = collection(db, conversationPath, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnapshot = await getDocs(messagesQuery);
    const conversationHistory = messagesSnapshot.docs.map((d: DocumentData) => {
        const data = d.data();
        // O senderId aqui deve ser o ID do usuário ou do admin
        const sender = data.senderId === adminId ? 'Atendente' : 'Cliente'; 
        return `${sender}: ${data.text}`;
    }).join('\n');

    // 4. Construir o prompt final combinado
    const finalPrompt = `
      ${globalPrompt}

      ${personalPrompt ? `---\nInstruções Adicionais:\n${personalPrompt}` : ''}

      ---
      Com base nas regras acima, e no histórico do diálogo abaixo, gere uma resposta curta e útil para o Atendente continuar a conversa. Fale diretamente ao Cliente.

      Histórico do Diálogo:
      ${conversationHistory}
      ---
      Sugestão de resposta:
    `;

    // 5. Chamar a IA para gerar a sugestão de resposta
    const result = await model.generateContent(finalPrompt);
    const response = await result.response;
    const suggestionText = response.text();

    // 6. Retornar a sugestão
    // O nome do campo é mantido como 'summary' para evitar quebrar o frontend imediatamente.
    // O ideal seria renomear para 'suggestion' no frontend também.
    return NextResponse.json({ summary: suggestionText });

  } catch (error) {
    console.error("Erro na API de sugestão de resposta: ", error);
    if (error instanceof Error) {
        console.error(error.message);
    }
    return NextResponse.json({ error: 'Ocorreu um erro interno ao gerar a sugestão.' }, { status: 500 });
  }
}
