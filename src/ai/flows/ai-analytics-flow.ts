
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

const KpiCardSchema = z.object({
    title: z.string().describe("The title of the KPI card (e.g., 'Общая выручка')."),
    value: z.string().describe("The main value of the KPI (e.g., '1,234,567 ₽')."),
    description: z.string().optional().describe("A brief description or context for the KPI (e.g., 'за последний месяц').")
});

const ChartDataItemSchema = z.object({
  name: z.string().describe('The label for the data point (e.g., a date, month, or category).'),
}).catchall(z.number().describe('The numerical value for a specific key.'));


const AIAnalyticsOutputSchema = z.object({
  summary: z.string().describe('A concise, natural language summary of the findings in Russian. This should be a detailed analysis, including trends, anomalies, and insights.'),
  kpiCards: z.array(KpiCardSchema).optional().describe('An array of key performance indicators. Generate this only if the query implies a high-level overview.'),
  chartData: z.array(ChartDataItemSchema).optional().describe('Data structured for creating a bar or line chart. Should be omitted if a chart is not relevant.'),
  chartType: z.enum(['bar', 'line', 'pie']).optional().describe("The recommended type of chart for the data. Defaults to 'bar' if not specified."),
  chartKeys: z.array(z.string()).optional().describe('An array of keys used in the chartData objects (e.g., ["доход", "расход"]). Should be omitted if a chart is not relevant.'),
  tableData: z.array(z.array(z.union([z.string(), z.number()]))).optional().describe("Data structured for a table view as an array of arrays (like a CSV). The first inner array should be the headers. Example: [[\"orderNumber\", \"profit\"], [\"ORD-101\", 5000], [\"ORD-102\", 4500]]"),
  tableColumns: z.array(z.string()).optional().describe("An array of string headers for the table. Example: [\"Номер заказа\", \"Прибыль (₽)\"]. This must be provided if 'tableData' is present and should correspond to the headers in tableData."),
});
export type AIAnalyticsOutput = z.infer<typeof AIAnalyticsOutputSchema>;


export async function analyzeData(input: AIAnalyticsInput): Promise<AIAnalyticsOutput> {
  return analyzeDataFlow(input);
}

const systemPrompt = `Ты — ведущий AI-аналитик в приложении для управления заказами. Твоя задача — проводить глубокий анализ данных о заказах и расходах, отвечая на вопросы пользователя на русском языке.

Твои задачи:
1.  **Внимательно изучи запрос пользователя (query)**. Определи ключевые метрики, периоды, срезы (по продавцам, товарам и т.д.).
2.  **Проанализируй предоставленные JSON-данные** (orders, expenses).
3.  **Сформируй комплексный ответ в формате JSON**, соответствующем схеме вывода. Ответ должен включать несколько блоков:
    *   **summary**: Детальный текстовый анализ на русском. Опиши основные выводы, тренды, аномалии и дай рекомендации. Это основной блок твоего ответа.
    *   **kpiCards**: Если запрос общий (например, "анализ за месяц"), сформируй 3-4 ключевых показателя (KPI). Например: общая выручка, чистая прибыль (выручка - себестоимость), средний чек, общее кол-во заказов.
    *   **chartData**: Если запрос подразумевает визуализацию (динамика, сравнение), подготовь данные для графика.
        - 'name' в chartData — это метка по оси X.
        - Остальные ключи — числовые значения для оси Y.
        - Укажи 'chartType' ('bar', 'line' или 'pie'), наиболее подходящий для визуализации.
        - В 'chartKeys' перечисли ключи, которые нужно отобразить.
    *   **tableData**: Если запрос требует детальной разбивки (например, "список самых прибыльных заказов"), сформируй данные для таблицы в формате **массива массивов**. Первый вложенный массив — это заголовки на английском (например, ["orderNumber", "profit"]). Последующие массивы — это строки данных.
    *   **tableColumns**: Если 'tableData' предоставлен, обязательно определи для него заголовки столбцов на русском языке. Порядок должен соответствовать tableData.

**Пример анализа:**
- Запрос: "Сравни доходы и расходы по месяцам за последний квартал и покажи топ-5 самых прибыльных заказов."
- Твой анализ:
    1.  Агрегировать доходы (price) и расходы (amount) по месяцам.
    2.  Рассчитать прибыль (price - cost) для каждого заказа и отсортировать по убыванию.
    3.  Подготовить данные для линейного графика для сравнения доходов и расходов.
    4.  Подготовить данные для таблицы с топ-5 заказами.
    5.  Сформировать текстовый вывод.
- **Пример твоего JSON-ответа**:
    {
      "summary": "За последний квартал наблюдается рост доходов... Самым прибыльным заказом стал ORD-XXX...",
      "kpiCards": [
        { "title": "Общая выручка", "value": "550,000 ₽", "description": "за квартал" },
        { "title": "Общие расходы", "value": "150,000 ₽", "description": "за квартал" },
        { "title": "Чистая прибыль", "value": "400,000 ₽", "description": "за квартал" }
      ],
      "chartType": "line",
      "chartData": [
        { "name": "Октябрь", "Доход": 150000, "Расход": 40000 },
        { "name": "Ноябрь", "Доход": 180000, "Расход": 50000 },
        { "name": "Декабрь", "Доход": 220000, "Расход": 60000 }
      ],
      "chartKeys": ["Доход", "Расход"],
      "tableData": [
        ["orderNumber", "product", "profit"],
        ["ORD-101", "фб", 5000],
        ["ORD-102", "хч", 4500]
      ],
      "tableColumns": ["Номер заказа", "Товар", "Прибыль (₽)"]
    }
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
