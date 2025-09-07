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
import {z} from 'genkit';

const SuggestResponseInputSchema = z.object({
  userInquiry: z.string().describe('A pergunta do usuário a ser respondida.'),
  adminUid: z.string().describe('O UID do administrador associado ao chat.'),
  // O campo useCustomInformation não é mais necessário aqui, pois virá da configuração.
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

// O schema de input para o prompt precisa das instruções.
const SuggestResponsePromptInputSchema = SuggestResponseInputSchema.extend({
    customInstructions: z.string().describe('Instruções personalizadas para guiar a resposta da IA.'),
    useCustomInformation: z.boolean().describe('Se deve usar informações personalizadas do usuário para produzir melhores conversas de suporte.'),
});


const SuggestResponseOutputSchema = z.object({
  suggestedResponse: z.string().describe('A resposta sugerida para a pergunta do usuário.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  // Buscar a configuração do admin (ou a global como fallback) do Firestore.
  const config = await getAiConfig(input.adminUid);

  return suggestResponseFlow({
      ...input,
      customInstructions: config.customInstructions,
      useCustomInformation: config.useCustomInformation,
  });
}

const prompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponsePromptInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `Você é um assistente de suporte ao cliente de IA ajudando administradores a responder às perguntas dos usuários.

  Use as seguintes instruções para guiar seu tom e estilo:
  {{{customInstructions}}}

  Gere uma resposta sugerida para a seguinte pergunta do usuário:
  "{{userInquiry}}"

  O UID do administrador associado a este chat é: {{adminUid}}.
  {{#if useCustomInformation}}
  Sinta-se à vontade para usar qualquer informação de contato ou histórico sobre este usuário para criar uma resposta mais personalizada e eficaz.
  {{/if}}

  Responda da forma mais útil possível.
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
