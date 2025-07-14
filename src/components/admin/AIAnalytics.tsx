
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2 } from 'lucide-react';
import type { Order, Expense } from '@/lib/types';
import { analyzeData } from '@/ai/flows/ai-analytics-flow';
import type { AIAnalyticsOutput } from '@/ai/flows/ai-analytics-flow';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AIAnalyticsProps {
  orders: Order[];
  expenses: Expense[];
}

export default function AIAnalytics({ orders, expenses }: AIAnalyticsProps) {
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AIAnalyticsOutput | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async () => {
    if (!query) {
      toast({
        variant: 'destructive',
        title: 'Пустой запрос',
        description: 'Пожалуйста, введите ваш вопрос для анализа.',
      });
      return;
    }
    setIsLoading(true);
    setAnalysisResult(null);
    try {
      const result = await analyzeData({
        query,
        orders,
        expenses,
      });
      setAnalysisResult(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка анализа',
        description: 'Не удалось получить ответ от AI. Попробуйте снова.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-аналитика</CardTitle>
          <CardDescription>
            Задайте вопрос на естественном языке, чтобы проанализировать данные о продажах и расходах.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Например: 'Покажи динамику продаж за последнюю неделю' или 'Сравни доходы и расходы по месяцам'."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={3}
            />
          </div>
          <Button onClick={handleAnalyze} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="mr-2 h-4 w-4" />
            )}
            Анализировать
          </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card>
          <CardContent className="p-6 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">AI-ассистент думает...</p>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Результаты анализа</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{analysisResult.summary}</p>
            </CardContent>
          </Card>
          
          {analysisResult.chartData && analysisResult.chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Визуализация</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analysisResult.chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                    <Legend />
                    {analysisResult.chartKeys?.map((key, index) => (
                      <Bar key={key} dataKey={key} fill={`var(--chart-${(index % 5) + 1})`} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
