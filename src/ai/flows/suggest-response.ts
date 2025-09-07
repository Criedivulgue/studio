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
  userInquiry: z.string().describe('The user inquiry to respond to.'),
  adminUid: z.string().describe('The admin UID associated with the chat.'),
  useCustomInformation: z.boolean().optional().describe('Whether to use custom user information to produce better support conversations.'),
});
export type SuggestResponseInput = z.infer<typeof SuggestResponseInputSchema>;

const SuggestResponseOutputSchema = z.object({
  suggestedResponse: z.string().describe('The suggested response to the user inquiry.'),
});
export type SuggestResponseOutput = z.infer<typeof SuggestResponseOutputSchema>;

export async function suggestResponse(input: SuggestResponseInput): Promise<SuggestResponseOutput> {
  return suggestResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestResponsePrompt',
  input: {schema: SuggestResponseInputSchema},
  output: {schema: SuggestResponseOutputSchema},
  prompt: `You are an AI customer support assistant helping admins respond to user inquiries.

  Generate a suggested response to the following user inquiry:

  {{userInquiry}}

  The admin UID associated with this chat is: {{adminUid}}.

  Respond as helpfully as possible.
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
