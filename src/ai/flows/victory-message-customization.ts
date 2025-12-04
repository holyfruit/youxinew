'use server';

/**
 * @fileOverview A flow for generating a personalized victory message for Chen Zhiyan.
 *
 * - generateVictoryMessage - A function that generates a personalized victory message.
 * - VictoryMessageInput - The input type for the generateVictoryMessage function.
 * - VictoryMessageOutput - The return type for the generateVictoryMessage function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VictoryMessageInputSchema = z.object({
  playerName: z.string().describe('The name of the player who won the game.'),
});

export type VictoryMessageInput = z.infer<typeof VictoryMessageInputSchema>;

const VictoryMessageOutputSchema = z.object({
  message: z.string().describe('The personalized victory message.'),
});

export type VictoryMessageOutput = z.infer<typeof VictoryMessageOutputSchema>;

export async function generateVictoryMessage(input: VictoryMessageInput): Promise<VictoryMessageOutput> {
  return victoryMessageFlow(input);
}

const victoryMessagePrompt = ai.definePrompt({
  name: 'victoryMessagePrompt',
  input: {schema: VictoryMessageInputSchema},
  output: {schema: VictoryMessageOutputSchema},
  prompt: `Congratulations, {{{playerName}}}! You've won the game! Chen Zhiyan,加油!好好学习!你也能和妈妈一样厉害!,
`,
});

const victoryMessageFlow = ai.defineFlow(
  {
    name: 'victoryMessageFlow',
    inputSchema: VictoryMessageInputSchema,
    outputSchema: VictoryMessageOutputSchema,
  },
  async input => {
    const {output} = await victoryMessagePrompt(input);
    return output!;
  }
);
