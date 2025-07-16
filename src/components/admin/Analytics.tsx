'use client';

import * as React from 'react';
import useSWR from 'swr';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, Filter, RefreshCw, TrendingUp, Users, Package, DollarSign, Receipt } from 'lucide-react';
import { AnalyticsData, AnalyticsFilters, User, OrderStatus, ExpenseCategory } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const fetcher = (url: string) => fetch(url).then(res => {
  if (!res.ok) {
    throw new Error('Ошибка загрузки данных');
  }
  return res.json();
});

interface AnalyticsProps {
  allUsers: User[];
}

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  color?: 'primary' | 'success' | 'warning' | 'destructive';
}

const KPICard: React.FC<KPICardProps> = ({ title, value, description, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'text-primary',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    destructive: 'text-red-600',
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            )}
          </div>
          <div className={`h-8 w-8 ${colorClasses[color]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const Analytics: React.FC<AnalyticsProps> = ({ allUsers }) => {
  const { toast } = useToast();
  const [filters, setFilters] = React.useState<AnalyticsFilters>({
    dateFrom: undefined,
    dateTo: undefined,
    sellers: undefined,
  });

  // Build query string for API
  const queryParams = new URLSearchParams();
  if (filters.dateFrom) queryParams.set('dateFrom', filters.dateFrom);
  if (filters.dateTo) queryParams.set('dateTo', filters.dateTo);
  if (filters.sellers && filters.sellers.length > 0) {
    queryParams.set('sellers', filters.sellers.join(','));
  }

  const { data: analytics, error, mutate, isLoading } = useSWR<AnalyticsData>(
    `/api/analytics?${queryParams.toString()}`,
    fetcher
  );

  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Ошибка загрузки аналитики',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  const handleFilterChange = (newFilters: Partial<AnalyticsFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleClearFilters = () => {
    setFilters({
      dateFrom: undefined,
      dateTo: undefined,
      sellers: undefined,
    });
  };

  const handleRefresh = () => {
    mutate();
  };

  // Prepare sellers list
  const sellers = React.useMemo(() => 
    allUsers.filter(user => user.role === 'Продавец'), 
    [allUsers]
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold">Аналитика</h2>
          <RefreshCw className="h-4 w-4 animate-spin" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Аналитика</h2>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Обновить
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Фильтры
          </CardTitle>
          <CardDescription>
            Настройте период и продавцов для анализа
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label htmlFor="dateFrom">Дата от</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleFilterChange({ dateFrom: e.target.value || undefined })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateTo">Дата до</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleFilterChange({ dateTo: e.target.value || undefined })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sellers">Продавцы</Label>
              <Select
                value={filters.sellers?.join(',') || 'all'}
                onValueChange={(value) => {
                  if (value === 'all') {
                    handleFilterChange({ sellers: undefined });
                  } else {
                    // For now, support single seller selection
                    handleFilterChange({ sellers: [value] });
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все продавцы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все продавцы</SelectItem>
                  {sellers.map((seller) => (
                    <SelectItem key={seller.username} value={seller.username}>
                      {seller.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={handleClearFilters}
                className="flex-1"
              >
                Сбросить
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI Cards */}
      {analytics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Общее количество заказов"
            value={analytics.totalOrders}
            icon={<Package className="h-8 w-8" />}
            color="primary"
          />
          <KPICard
            title="Общая сумма выводов"
            value={`${analytics.totalPayouts.toLocaleString('ru-RU')} ₽`}
            icon={<DollarSign className="h-8 w-8" />}
            color="success"
          />
          <KPICard
            title="Средняя цена заказа"
            value={`${Math.round(analytics.averageOrderPrice).toLocaleString('ru-RU')} ₽`}
            icon={<TrendingUp className="h-8 w-8" />}
            color="primary"
          />
          <KPICard
            title="Общая сумма расходов"
            value={`${Object.values(analytics.expensesByCategory).reduce((sum, amount) => sum + amount, 0).toLocaleString('ru-RU')} ₽`}
            icon={<Receipt className="h-8 w-8" />}
            color="warning"
          />
        </div>
      )}

      {/* Orders by Status Table */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Заказы по статусам</CardTitle>
            <CardDescription>
              Распределение заказов по текущим статусам
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Статус</TableHead>
                  <TableHead className="text-right">Количество</TableHead>
                  <TableHead className="text-right">Процент</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(analytics.ordersByStatus).map(([status, count]) => {
                  const percentage = analytics.totalOrders > 0 
                    ? ((count / analytics.totalOrders) * 100).toFixed(1)
                    : '0.0';
                  
                  const getStatusColor = (status: string) => {
                    switch (status) {
                      case 'Исполнен': return 'default';
                      case 'Отменен': case 'Возврат': return 'destructive';
                      case 'Отправлен': return 'outline';
                      default: return 'secondary';
                    }
                  };

                  return (
                    <TableRow key={status}>
                      <TableCell>
                        <Badge variant={getStatusColor(status)}>{status}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">{count}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{percentage}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Expenses by Category Table */}
      {analytics && (
        <Card>
          <CardHeader>
            <CardTitle>Расходы по категориям</CardTitle>
            <CardDescription>
              Распределение расходов по категориям
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                  <TableHead className="text-right">Процент</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(analytics.expensesByCategory)
                  .filter(([_, amount]) => amount > 0) // Only show categories with expenses
                  .sort(([, a], [, b]) => b - a) // Sort by amount descending
                  .map(([category, amount]) => {
                    const totalExpenses = Object.values(analytics.expensesByCategory).reduce((sum, amt) => sum + amt, 0);
                    const percentage = totalExpenses > 0 
                      ? ((amount / totalExpenses) * 100).toFixed(1)
                      : '0.0';

                    return (
                      <TableRow key={category}>
                        <TableCell className="font-medium">{category}</TableCell>
                        <TableCell className="text-right font-medium">
                          {amount.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">{percentage}%</TableCell>
                      </TableRow>
                    );
                  })}
                {Object.values(analytics.expensesByCategory).every(amount => amount === 0) && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                      Нет данных о расходах за выбранный период
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 