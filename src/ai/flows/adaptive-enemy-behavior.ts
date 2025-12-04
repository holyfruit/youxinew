'use server';

/**
 * @fileOverview 一个 AI 代理，根据玩家的接近程度和行动来决定敌人的行为。
 *
 * - getEnemyBehavior - 一个决定敌人行为的函数。
 * - EnemyBehaviorInput - getEnemyBehavior 函数的输入类型。
 * - EnemyBehaviorOutput - getEnemyBehavior 函数的返回类型。
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const EnemyBehaviorInputSchema = z.object({
  playerProximity: z
    .string()
    .describe("玩家与敌人的接近程度（例如，'近'、'中'、'远'）。"),
  playerAction: z
    .string()
    .describe("玩家当前的行为（例如，'站立'、'移动'、'攻击'）。"),
  enemyHealth: z.number().describe('敌人的当前生命值。'),
});
export type EnemyBehaviorInput = z.infer<typeof EnemyBehaviorInputSchema>;

const EnemyBehaviorOutputSchema = z.object({
  behavior: z
    .string()
    .describe(
      "AI 决定的敌人行为（例如，巡逻、追逐、攻击、防御）。"
    ),
  reasoning: z.string().describe('AI 选择该行为的推理。'),
});
export type EnemyBehaviorOutput = z.infer<typeof EnemyBehaviorOutputSchema>;

export async function getEnemyBehavior(input: EnemyBehaviorInput): Promise<EnemyBehaviorOutput> {
  return enemyBehaviorFlow(input);
}

const prompt = ai.definePrompt({
  name: 'enemyBehaviorPrompt',
  input: {schema: EnemyBehaviorInputSchema},
  output: {schema: EnemyBehaviorOutputSchema},
  prompt: `你是一位专业游戏 AI 设计师。根据当前情况，为游戏中的敌人决定最佳行为。

考虑以下因素：
- 玩家接近程度：{{{playerProximity}}}
- 玩家行为：{{{playerAction}}}
- 敌人生命值：{{{enemyHealth}}}

可用行为：巡逻、追逐、攻击、防御

根据这些因素，决定敌人最合适的行为，并简要解释你的推理。

将你的响应格式化为包含“behavior”和“reasoning”字段的 JSON 对象。`,
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
