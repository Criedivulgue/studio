import { NextResponse } from 'next/server';
// CORREÇÃO: Importa a função que obtém as instâncias do Admin SDK
import { getAdminInstances } from '@/lib/firebase-admin'; 
import { z } from 'zod';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Esquema de validação para o corpo da requisição
const requestSchema = z.object({
  sessionId: z.string().min(1, "O ID da sessão é obrigatório."),
});

// Inicialização do cliente da API de IA Generativa do Google
if (!process.env.GEMINI_API_KEY) {
  throw new Error('A variável de ambiente GEMINI_API_KEY não está definida.');
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(request: Request) {
  console.log('Recebida requisição para resumir o chat...');

  try {
    // CORREÇÃO: Obtém a instância do adminDb de forma segura
    const { db: adminDb } = getAdminInstances();

    const body = await request.json();
    const validation = requestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: 'Requisição inválida', details: validation.error.formErrors }, { status: 400 });
    }

    const { sessionId } = validation.data;
    const messagesPath = `chatSessions/${sessionId}/messages`;
    console.log(`Buscando mensagens em: ${messagesPath}`);

    // O restante do código funciona como antes
    const messagesSnapshot = await adminDb.collection(messagesPath).orderBy('timestamp', 'asc').get();

    if (messagesSnapshot.empty) {
      console.log('Nenhuma mensagem encontrada para resumir.');
      return NextResponse.json({ summary: 'Não há mensagens para resumir.' }, { status: 200 });
    }

    const conversation = messagesSnapshot.docs.map(doc => {
      const data = doc.data();
      return `${data.role === 'user' ? 'Usuário' : 'Assistente'}: ${data.content}`;
    }).join('\n');

    console.log('Conversa extraída para resumo:', conversation);

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Resuma a seguinte conversa de chat em uma única frase concisa:\n---\n${conversation}\n---\nResumo:`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const summary = response.text();

    console.log('Resumo gerado com sucesso:', summary);

    const sessionRef = adminDb.doc(`chatSessions/${sessionId}`);
    await sessionRef.update({ summary: summary });

    return NextResponse.json({ summary }, { status: 200 });

  } catch (error) {
    console.error('Erro ao gerar o resumo do chat:', error);
    const errorMessage = error instanceof Error ? error.message : 'Ocorreu um erro desconhecido';
    return NextResponse.json({ error: 'Erro interno do servidor', details: errorMessage }, { status: 500 });
  }
}
