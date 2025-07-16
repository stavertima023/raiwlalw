'use client';

import * as React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CalendarIcon, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { Order, Expense, User, OrderStatus, ExpenseCategory } from '@/lib/types';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { ru } from 'date-fns/locale';

interface AnalyticsProps {
  orders: Order[];
  expenses: Expense[];
  users: User[];
}

interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  seller: string | 'all';
}

interface OrderMetrics {
  totalOrders: number;
  addedOrders: number;
  completedOrders: number;
  shippedOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  totalRevenue: number;
  averageOrderPrice: number;
}

interface ExpenseSummary {
  [category: string]: number;
}

export function Analytics({ orders, expenses, users }: AnalyticsProps) {
  const [filters, setFilters] = React.useState<AnalyticsFilters>({
    dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    seller: 'all',
  });

  // Быстрые фильтры по периодам
  const quickFilters = [
    {
      label: 'Текущий месяц',
      dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    },
    {
      label: 'Текущий год',
      dateFrom: format(startOfYear(new Date()), 'yyyy-MM-dd'),
      dateTo: format(endOfYear(new Date()), 'yyyy-MM-dd'),
    },
    {
      label: 'Последние 30 дней',
      dateFrom: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
      dateTo: format(new Date(), 'yyyy-MM-dd'),
    },
  ];

  // Фильтрация данных
  const filteredOrders = React.useMemo(() => {
    let filtered = [...orders];

    // Фильтр по датам
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate <= toDate;
      });
    }

    // Фильтр по продавцу
    if (filters.seller !== 'all') {
      filtered = filtered.filter(order => order.seller === filters.seller);
    }

    return filtered;
  }, [orders, filters]);

  const filteredExpenses = React.useMemo(() => {
    let filtered = [...expenses];

    // Фильтр по датам
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate <= toDate;
      });
    }

    return filtered;
  }, [expenses, filters]);

  // Расчет метрик заказов
  const orderMetrics = React.useMemo((): OrderMetrics => {
    const totalOrders = filteredOrders.length;
    const addedOrders = filteredOrders.filter(order => order.status === 'Добавлен').length;
    const completedOrders = filteredOrders.filter(order => order.status === 'Исполнен').length;
    const shippedOrders = filteredOrders.filter(order => order.status === 'Отправлен').length;
    const cancelledOrders = filteredOrders.filter(order => order.status === 'Отменен').length;
    const returnedOrders = filteredOrders.filter(order => order.status === 'Возврат').length;
    
    // Считаем только выполненные заказы для выручки
    const completedOrdersForRevenue = filteredOrders.filter(order => 
      order.status === 'Исполнен' || order.status === 'Отправлен'
    );
    const totalRevenue = completedOrdersForRevenue.reduce((sum, order) => sum + order.price, 0);
    const averageOrderPrice = completedOrdersForRevenue.length > 0 
      ? totalRevenue / completedOrdersForRevenue.length 
      : 0;

    return {
      totalOrders,
      addedOrders,
      completedOrders,
      shippedOrders,
      cancelledOrders,
      returnedOrders,
      totalRevenue,
      averageOrderPrice,
    };
  }, [filteredOrders]);

  // Расчет суммы выводов (выплат)
  const totalPayouts = React.useMemo(() => {
    // Выводы считаем как завершенные заказы в выбранном периоде
    const completedOrders = filteredOrders.filter(order => order.status === 'Исполнен');
    return completedOrders.reduce((sum, order) => sum + order.price, 0);
  }, [filteredOrders]);

  // Расчет расходов по категориям
  const expensesByCategory = React.useMemo((): ExpenseSummary => {
    const summary: ExpenseSummary = {};
    
    filteredExpenses.forEach(expense => {
      const category = expense.category;
      summary[category] = (summary[category] || 0) + expense.amount;
    });

    return summary;
  }, [filteredExpenses]);

  const totalExpenses = React.useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  // Получение списка продавцов
  const sellers = React.useMemo(() => {
    const sellerUsernames = Array.from(new Set(orders.map(order => order.seller)));
    return sellerUsernames.map(username => {
      const user = users.find(u => u.username === username);
      return {
        username,
        name: user?.name || username,
      };
    });
  }, [orders, users]);

  const handleQuickFilter = (quickFilter: typeof quickFilters[0]) => {
    setFilters(prev => ({
      ...prev,
      dateFrom: quickFilter.dateFrom,
      dateTo: quickFilter.dateTo,
    }));
  };

  const clearFilters = () => {
    setFilters({
      dateFrom: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      dateTo: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
      seller: 'all',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Аналитика
          </CardTitle>
          <CardDescription>
            Основные метрики и показатели эффективности
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Фильтры */}
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {quickFilters.map((quickFilter, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickFilter(quickFilter)}
                >
                  {quickFilter.label}
                </Button>
              ))}
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Сбросить
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="text-sm font-medium">От</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">До</label>
                <Input
                  type="date"
                  value={filters.dateTo || ''}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">Продавец</label>
                <Select
                  value={filters.seller}
                  onValueChange={(value) => setFilters(prev => ({ ...prev, seller: value }))}
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
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Метрики заказов */}
      <Card>
        <CardHeader>
          <CardTitle>Метрики заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Показатель</TableHead>
                <TableHead className="text-right">Значение</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Общее количество заказов</TableCell>
                <TableCell className="text-right">{orderMetrics.totalOrders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Заказы со статусом "Добавлен"</TableCell>
                <TableCell className="text-right">{orderMetrics.addedOrders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Заказы со статусом "Исполнен"</TableCell>
                <TableCell className="text-right">{orderMetrics.completedOrders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Заказы со статусом "Отправлен"</TableCell>
                <TableCell className="text-right">{orderMetrics.shippedOrders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Заказы со статусом "Отменен"</TableCell>
                <TableCell className="text-right">{orderMetrics.cancelledOrders}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Заказы со статусом "Возврат"</TableCell>
                <TableCell className="text-right">{orderMetrics.returnedOrders}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Финансовые метрики */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              Доходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Общая сумма выводов</TableCell>
                  <TableCell className="text-right text-green-600 font-semibold">
                    {totalPayouts.toLocaleString('ru-RU')} ₽
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Средняя сумма цены заказов</TableCell>
                  <TableCell className="text-right">
                    {orderMetrics.averageOrderPrice.toLocaleString('ru-RU')} ₽
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Общая выручка</TableCell>
                  <TableCell className="text-right font-semibold">
                    {orderMetrics.totalRevenue.toLocaleString('ru-RU')} ₽
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              Расходы
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Категория</TableHead>
                  <TableHead className="text-right">Сумма</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(expensesByCategory).map(([category, amount]) => (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="text-right text-red-600">
                      {amount.toLocaleString('ru-RU')} ₽
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="border-t-2">
                  <TableCell className="font-semibold">Итого расходов</TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    {totalExpenses.toLocaleString('ru-RU')} ₽
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Сводная прибыль */}
      <Card>
        <CardHeader>
          <CardTitle>Сводка</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Общая выручка</TableCell>
                <TableCell className="text-right text-green-600 font-semibold">
                  +{orderMetrics.totalRevenue.toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Общие расходы</TableCell>
                <TableCell className="text-right text-red-600 font-semibold">
                  -{totalExpenses.toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
              <TableRow className="border-t-2">
                <TableCell className="font-bold text-lg">Чистая прибыль</TableCell>
                <TableCell className="text-right font-bold text-lg">
                  {(orderMetrics.totalRevenue - totalExpenses) >= 0 ? (
                    <span className="text-green-600">
                      +{(orderMetrics.totalRevenue - totalExpenses).toLocaleString('ru-RU')} ₽
                    </span>
                  ) : (
                    <span className="text-red-600">
                      {(orderMetrics.totalRevenue - totalExpenses).toLocaleString('ru-RU')} ₽
                    </span>
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 