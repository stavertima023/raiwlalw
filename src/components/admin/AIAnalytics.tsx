
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Wand2, Lightbulb, BarChart, FileText, Table2 } from 'lucide-react';
import type { Order, Expense } from '@/lib/types';
import { analyzeData, AIAnalyticsOutput } from '@/ai/flows/ai-analytics-flow';
import { useToast } from '@/hooks/use-toast';
import { BarChart as RechartsBarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { KPICard } from './KPI-Card';
import { DataTable } from './DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AIAnalyticsProps {
  orders: Order[];
  expenses: Expense[];
}

const sampleQueries = [
    "Покажи топ-3 товара за май",
    "Анализируй динамику продаж по продавцам",
    "Сделай прогноз по категории хч",
    "Где самые высокие расходы за последний квартал?"
];

export default function AIAnalytics({ orders, expenses }: AIAnalyticsProps) {
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [analysisResult, setAnalysisResult] = React.useState<AIAnalyticsOutput | null>(null);
  const { toast } = useToast();

  const handleAnalyze = async (currentQuery = query) => {
    if (!currentQuery) {
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
      const response = await fetch('/api/ai-analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: currentQuery }),
      });
      
      if (!response.ok) {
        throw new Error('Ошибка получения анализа');
      }
      
      const data = await response.json();
      
      // Convert OpenAI response to our format
      const result: AIAnalyticsOutput = {
        summary: data.analysis,
        kpiCards: [
          { title: 'Заказов', value: data.dataPoints.ordersCount.toString(), description: 'Всего заказов' },
          { title: 'Расходов', value: data.dataPoints.expensesCount.toString(), description: 'Всего расходов' },
          { title: 'Доходы', value: `${data.dataPoints.totalRevenue?.toLocaleString('ru-RU')} ₽`, description: 'Общий доход' },
          { title: 'Расходы', value: `${data.dataPoints.totalExpenses?.toLocaleString('ru-RU')} ₽`, description: 'Общие расходы' },
        ],
        chartData: [],
        chartType: 'bar',
        chartKeys: [],
        tableData: [],
        tableColumns: [],
      };
      
      setAnalysisResult(result);
    } catch (error: any) {
      console.error('AI analysis failed:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка анализа',
        description: error.message || 'Не удалось получить ответ от AI. Попробуйте снова.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleQueryClick = (sample: string) => {
    setQuery(sample);
    handleAnalyze(sample);
  }
  
  const formattedTableData = React.useMemo(() => {
    if (!analysisResult?.tableData || analysisResult.tableData.length < 2) {
      return { columns: [], data: [] };
    }
    const headers = analysisResult.tableData[0];
    const columnLabels = analysisResult.tableColumns || headers;

    const columns = headers.map((header, index) => ({
      key: String(header),
      label: String(columnLabels[index] || header),
    }));

    const data = analysisResult.tableData.slice(1).map(row => {
      const rowObject: Record<string, any> = {};
      headers.forEach((header, index) => {
        rowObject[String(header)] = row[index];
      });
      return rowObject;
    });

    return { columns, data };
  }, [analysisResult]);


  const renderChart = () => {
    if (!analysisResult || !analysisResult.chartData || analysisResult.chartData.length === 0) return null;

    const chartProps = {
      data: analysisResult.chartData,
    };
    
    const colors = ["#8884d8", "#82ca9d", "#ffc658", "#ff8042", "#0088FE", "#00C49F"];

    switch (analysisResult.chartType) {
        case 'line':
            return (
                <LineChart {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                    <Legend />
                    {analysisResult.chartKeys?.map((key, index) => (
                      <Line key={key} type="monotone" dataKey={key} stroke={colors[index % colors.length]} />
                    ))}
                </LineChart>
            );
        case 'pie':
             return (
                <PieChart>
                    <Pie data={analysisResult.chartData} dataKey={analysisResult.chartKeys?.[0] || 'value'} nameKey="name" cx="50%" cy="50%" outerRadius={100} fill="#8884d8" label>
                         {analysisResult.chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                        ))}
                    </Pie>
                     <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                    <Legend />
                </PieChart>
             );
        case 'bar':
        default:
            return (
                <RechartsBarChart {...chartProps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}/>
                    <Legend />
                    {analysisResult.chartKeys?.map((key, index) => (
                      <Bar key={key} dataKey={key} fill={colors[index % colors.length]} />
                    ))}
                </RechartsBarChart>
            );
    }
  }


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI-аналитика</CardTitle>
          <CardDescription>
            Задайте вопрос на естественном языке для анализа данных. AI-ассистент обработает запрос и представит результаты в виде текста, графиков и таблиц.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-2">
                <Textarea
                placeholder="Например: 'Сравни доходы и расходы по месяцам за последний квартал...'"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
                className="text-base"
                />
            </div>
            <div className="flex flex-wrap gap-2">
                {sampleQueries.map(sample => (
                    <Button key={sample} variant="outline" size="sm" onClick={() => handleSampleQueryClick(sample)}>
                        {sample}
                    </Button>
                ))}
            </div>
            <Button onClick={() => handleAnalyze()} disabled={isLoading} size="lg">
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
          <CardContent className="p-6 flex flex-col items-center justify-center space-y-4 h-64">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-muted-foreground">AI-ассистент анализирует данные...</p>
            <p className="text-sm text-muted-foreground/80">Это может занять до 30 секунд.</p>
          </CardContent>
        </Card>
      )}

      {analysisResult && (
        <div className="space-y-6">
            
            {analysisResult.kpiCards && analysisResult.kpiCards.length > 0 && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {analysisResult.kpiCards.map(kpi => (
                        <KPICard key={kpi.title} title={kpi.title} value={kpi.value} description={kpi.description} icon={Lightbulb} />
                    ))}
                </div>
            )}
        
          <Card>
             <Tabs defaultValue="summary" className="w-full">
                <CardHeader>
                     <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="summary"><FileText className="mr-2 h-4 w-4"/>Сводка</TabsTrigger>
                        <TabsTrigger value="chart" disabled={!analysisResult.chartData || analysisResult.chartData.length === 0}><BarChart className="mr-2 h-4 w-4"/>График</TabsTrigger>
                        <TabsTrigger value="table" disabled={!analysisResult.tableData || analysisResult.tableData.length === 0}><Table2 className="mr-2 h-4 w-4"/>Таблица</TabsTrigger>
                    </TabsList>
                </CardHeader>
                <CardContent>
                    <TabsContent value="summary" className="space-y-4">
                         <h3 className="text-lg font-semibold">Аналитический отчет</h3>
                         <p className="whitespace-pre-wrap text-base leading-relaxed">{analysisResult.summary}</p>
                    </TabsContent>
                    <TabsContent value="chart">
                       {analysisResult.chartData && analysisResult.chartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={400}>
                                {renderChart() || <div>Нет данных для отображения</div>}
                            </ResponsiveContainer>
                       ): (
                           <p className="text-muted-foreground text-center">Для этого запроса нет данных для визуализации.</p>
                       )}
                    </TabsContent>
                    <TabsContent value="table">
                         {formattedTableData.data.length > 0 ? (
                            <DataTable columns={formattedTableData.columns} data={formattedTableData.data} />
                       ): (
                           <p className="text-muted-foreground text-center">Для этого запроса нет табличных данных.</p>
                       )}
                    </TabsContent>
                </CardContent>
             </Tabs>
          </Card>
        </div>
      )}
    </div>
  );
}
