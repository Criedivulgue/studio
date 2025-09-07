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
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

const SuggestResponseOutputSchema = z.object({
  suggestedResponse: z.string().describe('A resposta sugerida para a pergunta do usuário.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  return suggestResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponseInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `Você é um assistente de suporte ao cliente de IA ajudando administradores a responder às perguntas dos usuários.

  Gere uma resposta sugerida para a seguinte pergunta do usuário:

  {{userInquiry}}

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
