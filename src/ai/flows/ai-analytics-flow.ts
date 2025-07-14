
'use server';
/**
 * @fileOverview An AI agent for analyzing sales and expense data.
 *
 * - analyzeData - A function that handles the data analysis process.
 * - AIAnalyticsInput - The input type for the analyzeData function.
 * - AIAnalyticsOutput - The return type for the analyzeData function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import type { Order, Expense } from '@/lib/types';

// We don't need a Zod schema for complex objects passed from server components.
export interface AIAnalyticsInput {
  query: string;
  orders: Order[];
  expenses: Expense[];
}

const ChartDataItemSchema = z.object({
  name: z.string().describe('The label for the data point (e.g., a date, month, or category).'),
}).catchall(z.number().describe('The numerical value for a specific key.'));

const AIAnalyticsOutputSchema = z.object({
  summary: z.string().describe('A concise, natural language summary of the findings in Russian.'),
  chartData: z.array(ChartDataItemSchema).optional().describe('Data structured for creating a bar chart. Should be omitted if a chart is not relevant.'),
  chartKeys: z.array(z.string()).optional().describe('An array of keys used in the chartData objects (e.g., ["доход", "расход"]). Should be omitted if a chart is not relevant.'),
});
export type AIAnalyticsOutput = z.infer<typeof AIAnalyticsOutputSchema>;


export async function analyzeData(input: AIAnalyticsInput): Promise<AIAnalyticsOutput> {
  return analyzeDataFlow(input);
}

const systemPrompt = `Ты — AI-ассистент в приложении для управления заказами. Твоя задача — анализировать данные о заказах и расходах и отвечать на вопросы пользователя на русском языке.

Предоставленные данные:
- Список заказов (orders): включает дату, номер, статус, цену, себестоимость и т.д.
- Список расходов (expenses): включает дату, сумму, категорию.

Твои задачи:
1.  Внимательно изучи запрос пользователя (query).
2.  Проанализируй предоставленные JSON-данные (orders, expenses).
3.  Сформируй краткий и ясный текстовый ответ (summary) на русском языке, обобщающий результаты анализа.
4.  Если запрос подразумевает визуализацию (например, "покажи динамику", "сравни доходы и расходы"), подготовь данные для графика (chartData).
    - 'name' в chartData — это метка по оси X (например, дата, месяц, категория).
    - Остальные ключи — это числовые значения для оси Y (например, "Доход", "Расход", "Прибыль").
    - В 'chartKeys' перечисли ключи, которые нужно отобразить на графике.
    - Если график не нужен, оставь chartData и chartKeys пустыми.
5.  Отвечай только в формате JSON, соответствующем схеме вывода.

Пример анализа:
- Запрос: "Сравни доходы и расходы за октябрь 2023"
- Анализ: Ты должен просуммировать 'price' всех заказов за октябрь (это доходы) и 'amount' всех расходов (это расходы).
- Ответ (summary): "В октябре 2023 доходы составили X руб., а расходы Y руб. ..."
- chartData: [{ name: "Октябрь 2023", "Доход": X, "Расход": Y }]
- chartKeys: ["Доход", "Расход"]
`;

const analyticsPrompt = ai.definePrompt({
    name: 'aiAnalyticsPrompt',
    system: systemPrompt,
    input: {
        schema: z.object({
            query: z.string(),
            orders: z.string(),
            expenses: z.string(),
        })
    },
    output: {
        schema: AIAnalyticsOutputSchema
    },
    prompt: `Проанализируй следующие данные на основе запроса пользователя.

Запрос пользователя: {{{query}}}

Данные по заказам (JSON):
{{{orders}}}

Данные по расходам (JSON):
{{{expenses}}}
`,
});


const analyzeDataFlow = ai.defineFlow(
  {
    name: 'analyzeDataFlow',
    inputSchema: z.any(), // Using any for non-serializable server component input
    outputSchema: AIAnalyticsOutputSchema,
  },
  async (input: AIAnalyticsInput) => {
    const { output } = await analyticsPrompt({
        query: input.query,
        orders: JSON.stringify(input.orders, null, 2),
        expenses: JSON.stringify(input.expenses, null, 2),
    });
    
    if (!output) {
        throw new Error("AI analysis returned no output.");
    }
    
    return output;
  }
);
