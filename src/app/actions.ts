'use server';

import { getEnemyBehavior, EnemyBehaviorInput, EnemyBehaviorOutput } from '@/ai/flows/adaptive-enemy-behavior';
import { generateVictoryMessage, VictoryMessageInput, VictoryMessageOutput } from '@/ai/flows/victory-message-customization';

export async function getEnemyBehaviorAction(input: EnemyBehaviorInput): Promise<EnemyBehaviorOutput> {
  try {
    return await getEnemyBehavior(input);
  } catch (error) {
    console.error("Error getting enemy behavior:", error);
    // Fallback behavior
    return { behavior: 'patrol', reasoning: 'Fell back to default due to an error.' };
  }
}

export async function getVictoryMessageAction(input: VictoryMessageInput): Promise<VictoryMessageOutput> {
  try {
    return await generateVictoryMessage(input);
  } catch (error) {
    console.error("Error generating victory message:", error);
    return { message: "Congratulations! You are a champion!" };
  }
}
