'use server';

import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '@/lib/firebase'; // Corrigido: Usando o SDK cliente padrão
import { collection, getDocs, orderBy, query, DocumentData } from 'firebase/firestore'; // Importações necessárias do Firestore

// Inicialização do Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

/**
 * Lida com requisições POST para gerar um resumo de uma conversa.
 */
export async function POST(req: NextRequest) {
  try {
    const { conversationPath } = await req.json();

    if (!conversationPath || typeof conversationPath !== 'string') {
      return NextResponse.json({ error: 'O caminho da conversa (conversationPath) é obrigatório.' }, { status: 400 });
    }

    // 1. Buscar todas as mensagens da conversa no Firestore
    const messagesRef = collection(db, conversationPath, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
    const messagesSnapshot = await getDocs(messagesQuery);

    if (messagesSnapshot.empty) {
      return NextResponse.json({ error: 'Nenhuma mensagem encontrada para resumir.' }, { status: 404 });
    }

    // 2. Formatar as mensagens para a IA
    const conversationHistory = messagesSnapshot.docs.map((doc: DocumentData) => { // Corrigido: Adicionado tipo para 'doc'
        const data = doc.data();
        // Assumindo que o ID do admin contém "admin". Ajuste se necessário.
        const sender = data.senderId.includes('admin') ? 'Atendente' : 'Cliente'; 
        return `${sender}: ${data.text}`;
    }).join('\n');

    // 3. Montar o prompt
    const model = genAI.getGenerativeModel({ model: "gemini-pro"});
    const prompt = `
        Você é um assistente de atendimento ao cliente qualificado.
        Sua tarefa é ler um chat e gerar um resumo conciso e informativo em um único parágrafo.
        O resumo deve destacar: o motivo do contato, os pontos chave discutidos e a resolução final.
        **Não inclua saudações ou despedidas.**

        Transcrição do chat:
        ---
        ${conversationHistory}
        ---
    `;

    // 4. Chamar a IA
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summaryText = response.text();

    // 5. Retornar o resumo
    return NextResponse.json({ summary: summaryText });

  } catch (error) {
    console.error("Erro na API de resumo: ", error);
    if (error instanceof Error) {
        console.error(error.message);
    }
    return NextResponse.json({ error: 'Ocorreu um erro interno ao gerar o resumo.' }, { status: 500 });
  }
}
