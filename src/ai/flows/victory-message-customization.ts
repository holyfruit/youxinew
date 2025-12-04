'use server';

/**
 * @fileOverview 用于为陈志扬生成个性化胜利消息的流程。
 *
 * - generateVictoryMessage - 生成个性化胜利消息的函数。
 * - VictoryMessageInput - generateVictoryMessage 函数的输入类型。
 * - VictoryMessageOutput - generateVictoryMessage 函数的返回类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VictoryMessageInputSchema = z.object({
  playerName: z.string().describe('赢得游戏的玩家名称。'),
});

export type VictoryMessageInput = z.infer<typeof VictoryMessageInputSchema>;

const VictoryMessageOutputSchema = z.object({
  message: z.string().describe('个性化的胜利消息。'),
});

export type VictoryMessageOutput = z.infer<typeof VictoryMessageOutputSchema>;

export async function generateVictoryMessage(input: VictoryMessageInput): Promise<VictoryMessageOutput> {
  return victoryMessageFlow(input);
}

const victoryMessagePrompt = ai.definePrompt({
  name: 'victoryMessagePrompt',
  input: {schema: VictoryMessageInputSchema},
  output: {schema: VictoryMessageOutputSchema},
  prompt: `恭喜你，{{{playerName}}}！你赢得了比赛！陈志扬，加油！好好学习！你也能和妈妈一样厉害！,
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
