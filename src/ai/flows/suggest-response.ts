'use server';
/**
 * @fileOverview An AI agent for suggesting responses to user inquiries.
 *
 * - suggestResponse - A function that suggests a response to a user inquiry.
 * - SuggestResponseInput - The input type for the suggestResponse function.
 * - SuggestResponseOutput - The return type for the suggestResponse function.
 */

import {ai} from '@/ai/genkit';
import { getAiConfig } from '@/services/configService';
import { db } from '@/lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import {z} from 'genkit';
import { Contact } from '@/lib/types';

// 1. ADICIONAR CONTACT ID AO INPUT SCHEMA
const SuggestResponseInputSchema = z.object({
  userInquiry: z.string().describe('A pergunta do usuário a ser respondida.'),
  adminUid: z.string().describe('O UID do administrador associado ao chat.'),
  contactId: z.string().optional().describe('O ID do contato (cliente) com quem se está conversando.'),
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

// 2. ADICIONAR CONTEXTO DO CLIENTE AO PROMPT SCHEMA
const SuggestResponsePromptInputSchema = SuggestResponseInputSchema.extend({
    customInstructions: z.string().describe('Instruções personalizadas para guiar a resposta da IA.'),
    useCustomInformation: z.boolean().describe('Se deve usar informações personalizadas do usuário para produzir melhores conversas de suporte.'),
    clientContext: z.string().optional().describe('Um resumo das informações e histórico do cliente.'),
});


const SuggestResponseOutputSchema = z.object({
  suggestedResponse: z.string().describe('A resposta sugerida para a pergunta do usuário.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

// 3. ATUALIZAR A FUNÇÃO PRINCIPAL
export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  // Buscar a configuração do admin (ou a global como fallback) do Firestore.
  const config = await getAiConfig(input.adminUid);

  let clientContext = '';

  // Se a permissão for concedida e tivermos um ID de contato, buscamos os dados.
  if (config.useCustomInformation && input.contactId) {
    try {
      // Buscar perfil do contato
      const contactRef = doc(db, 'contacts', input.contactId);
      const contactSnap = await getDoc(contactRef);

      let contextParts: string[] = [];

      if (contactSnap.exists()) {
        const contactData = contactSnap.data() as Contact;
        contextParts.push(`- Nome: ${contactData.name}`);
        contextParts.push(`- Email: ${contactData.email}`);
        if (contactData.interesses && contactData.interesses.length > 0) {
          contextParts.push(`- Interesses: ${contactData.interesses.join(', ')}`);
        }
      }

      // Buscar histórico de resumos
      const historyRef = collection(db, 'contacts', input.contactId, 'history');
      const historySnap = await getDocs(historyRef);

      if (!historySnap.empty) {
        const summaries = historySnap.docs.map(doc => doc.data().summary).filter(Boolean);
        if(summaries.length > 0) {
            contextParts.push("\n- Histórico de Conversas Anteriores (Resumos):");
            summaries.forEach((summary, index) => {
                contextParts.push(`  ${index + 1}. ${summary}`);
            });
        }
      }

      if(contextParts.length > 0) {
        clientContext = "Aqui estão as informações sobre o cliente para personalizar sua resposta:\n" + contextParts.join('\n');
      }

    } catch (error) {
      console.error("Erro ao buscar contexto do cliente:", error);
      // Não impede a execução, apenas não enriquece o prompt.
    }
  }

  return suggestResponseFlow({
      ...input,
      customInstructions: config.customInstructions,
      useCustomInformation: config.useCustomInformation,
      clientContext: clientContext, // Passa o contexto para o fluxo
  });
}

// 4. ATUALIZAR O PROMPT PARA USAR O NOVO CONTEXTO
const prompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponsePromptInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `Você é um assistente de suporte ao cliente de IA ajudando administradores a responder às perguntas dos usuários.

  Use as seguintes instruções para guiar seu tom e estilo:
  {{{customInstructions}}}

  {{#if useCustomInformation}}
    {{#if clientContext}}
  {{{clientContext}}}
    {{else}}
  Você tem permissão para usar informações do cliente, mas nenhuma foi encontrada.
    {{/if}}
  {{/if}}

  Gere uma resposta sugerida para a seguinte pergunta do usuário:
  "{{userInquiry}}"

  Responda da forma mais útil possível, integrando as informações do cliente, se disponíveis, para criar uma experiência personalizada e eficaz.
  `,
});

const suggestResponseFlow = ai.defineFlow(
  {
    name: 'suggestResponseFlow',
    inputSchema: SuggestResponsePromptInputSchema,
    outputSchema: SuggestResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
