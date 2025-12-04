'use server';

/**
 * @fileOverview An AI agent that determines the enemy's behavior based on the player's proximity and actions.
 *
 * - getEnemyBehavior - A function that determines the enemy behavior.
 * - EnemyBehaviorInput - The input type for the getEnemyBehavior function.
 * - EnemyBehaviorOutput - The return type for the getEnemyBehavior function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnemyBehaviorInputSchema = z.object({
  playerProximity: z
    .string()
    .describe("The player's proximity to the enemy (e.g., 'close', 'medium', 'far')."),
  playerAction: z
    .string()
    .describe("The player's current action (e.g., 'idle', 'moving', 'attacking')."),
  enemyHealth: z.number().describe('The current health of the enemy.'),
});
export type EnemyBehaviorInput = z.infer<typeof EnemyBehaviorInputSchema>;

const EnemyBehaviorOutputSchema = z.object({
  behavior: z
    .string()
    .describe(
      'The AI-determined behavior of the enemy (e.g., patrol, chase, attack, defend).' // Added "defend"
    ),
  reasoning: z.string().describe('The AI reasoning behind the chosen behavior.'),
});
export type EnemyBehaviorOutput = z.infer<typeof EnemyBehaviorOutputSchema>;

export async function getEnemyBehavior(input: EnemyBehaviorInput): Promise<EnemyBehaviorOutput> {
  return enemyBehaviorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enemyBehaviorPrompt',
  input: {schema: EnemyBehaviorInputSchema},
  output: {schema: EnemyBehaviorOutputSchema},
  prompt: `You are an expert game AI designer. Determine the best behavior for an enemy in a game based on the current situation.

Consider the following factors:
- Player Proximity: {{{playerProximity}}}
- Player Action: {{{playerAction}}}
- Enemy Health: {{{enemyHealth}}}

Available Behaviors: patrol, chase, attack, defend

Based on these factors, determine the most appropriate behavior for the enemy and provide a short explanation of your reasoning.

Format your response as a JSON object with "behavior" and "reasoning" fields.`,
});

const enemyBehaviorFlow = ai.defineFlow(
  {
    name: 'enemyBehaviorFlow',
    inputSchema: EnemyBehaviorInputSchema,
    outputSchema: EnemyBehaviorOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
