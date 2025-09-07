'use server';
/**
 * @fileOverview An AI agent for suggesting responses to user inquiries.
 *
 * - suggestResponse - A function that suggests a response to a user inquiry.
 * - SuggestResponseInput - The input type for the suggestResponse function.
 * - SuggestResponseOutput - The return type for the suggestResponse function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestResponseInputSchema = z.object({
  userInquiry: z.string().describe('A pergunta do usuário a ser respondida.'),
  adminUid: z.string().describe('O UID do administrador associado ao chat.'),
  useCustomInformation: z.boolean().optional().describe('Se deve usar informações personalizadas do usuário para produzir melhores conversas de suporte.'),
  customInstructions: z.string().optional().describe('Instruções personalizadas para guiar a resposta da IA.'),
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

const SuggestResponseOutputSchema = z.object({
  suggestedResponse: z.string().describe('A resposta sugerida para a pergunta do usuário.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  // Lógica futura: buscar as instruções do banco de dados com base no adminUid
  let instructions = '';
  if (input.adminUid === 'super-admin') {
      // Em um caso real, buscaríamos as instruções globais salvas pelo super-admin.
      // Por enquanto, usaremos um valor padrão que pode ser passado.
      instructions = input.customInstructions || 'Você é o assistente geral da OmniFlow AI. Seja prestativo e informativo.';
  } else {
       // Em um caso real, buscaríamos as instruções específicas do admin.
      instructions = input.customInstructions || `As instruções para ${input.adminUid} ainda não foram configuradas.`;
  }

  return suggestResponseFlow({
      ...input,
      customInstructions: instructions,
  });
}

const prompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponseInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `Você é um assistente de suporte ao cliente de IA ajudando administradores a responder às perguntas dos usuários.

  Use as seguintes instruções para guiar seu tom e estilo:
  {{{customInstructions}}}

  Gere uma resposta sugerida para a seguinte pergunta do usuário:
  "{{userInquiry}}"

  O UID do administrador associado a este chat é: {{adminUid}}.

  Responda da forma mais útil possível.
  `,
});

const suggestResponseFlow = ai.defineFlow(
  {
    name: 'suggestResponseFlow',
    inputSchema: SuggestResponseInputSchema,
    outputSchema: SuggestResponseOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
