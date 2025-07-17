'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { Order, User, Expense, Payout } from '@/lib/types-pure';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { 
  BarChart3, 
  TrendingUp, 
  Package, 
  DollarSign, 
  Users, 
  Calendar,
  Filter,
  Receipt,
  UserCheck
} from 'lucide-react';

interface AnalyticsProps {
  orders: Order[];
  users: User[];
  expenses: Expense[];
  payouts: Payout[];
}

interface OrderStats {
  total: number;
  added: number;
  completed: number;
  shipped: number;
  cancelled: number;
  returned: number;
  averagePrice: number;
}

interface ExpenseStats {
  [key: string]: number;
}

interface ResponsibleStats {
  [key: string]: number;
}

export function Analytics({ orders, users, expenses, payouts }: AnalyticsProps) {
  const [dateFrom, setDateFrom] = React.useState('');
  const [dateTo, setDateTo] = React.useState('');
  const [selectedSeller, setSelectedSeller] = React.useState<string>('all');
  const [selectedExpenseCategory, setSelectedExpenseCategory] = React.useState<string>('all');
  const [selectedResponsible, setSelectedResponsible] = React.useState<string>('all');

  // Filter orders based on date range and seller
  const filteredOrders = React.useMemo(() => {
    let filtered = [...orders];

    // Filter by seller
    if (selectedSeller !== 'all') {
      filtered = filtered.filter(order => order.seller === selectedSeller);
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(order => {
        const orderDate = new Date(order.orderDate);
        return orderDate <= toDate;
      });
    }

    return filtered;
  }, [orders, dateFrom, dateTo, selectedSeller]);

  // Filter expenses based on date range, category and responsible
  const filteredExpenses = React.useMemo(() => {
    let filtered = [...expenses];

    // Filter by category
    if (selectedExpenseCategory !== 'all') {
      filtered = filtered.filter(expense => expense.category === selectedExpenseCategory);
    }

    // Filter by responsible
    if (selectedResponsible !== 'all') {
      filtered = filtered.filter(expense => expense.responsible === selectedResponsible);
    }

    // Filter by date range
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate <= toDate;
      });
    }

    return filtered;
  }, [expenses, dateFrom, dateTo, selectedExpenseCategory, selectedResponsible]);

  // Filter payouts based on date range and seller
  const filteredPayouts = React.useMemo(() => {
    let filtered = [...payouts];

    if (selectedSeller !== 'all') {
      filtered = filtered.filter(payout => payout.seller === selectedSeller);
    }

    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      filtered = filtered.filter(payout => {
        const payoutDate = new Date(payout.date);
        return payoutDate >= fromDate;
      });
    }

    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(payout => {
        const payoutDate = new Date(payout.date);
        return payoutDate <= toDate;
      });
    }

    return filtered;
  }, [payouts, dateFrom, dateTo, selectedSeller]);

  // Calculate order statistics
  const orderStats: OrderStats = React.useMemo(() => {
    const total = filteredOrders.length;
    const added = filteredOrders.filter(order => order.status === 'Добавлен').length;
    const completed = filteredOrders.filter(order => order.status === 'Исполнен').length;
    const shipped = filteredOrders.filter(order => order.status === 'Отправлен').length;
    const cancelled = filteredOrders.filter(order => order.status === 'Отменен').length;
    const returned = filteredOrders.filter(order => order.status === 'Возврат').length;
    
    const totalPrice = filteredOrders.reduce((sum, order) => sum + order.price, 0);
    const averagePrice = total > 0 ? totalPrice / total : 0;

    return {
      total,
      added,
      completed,
      shipped,
      cancelled,
      returned,
      averagePrice
    };
  }, [filteredOrders]);

  // Calculate expense statistics by category
  const expenseStats: ExpenseStats = React.useMemo(() => {
    // Initialize stats object with static categories to avoid circular dependency
    const stats: ExpenseStats = {
      'Аренда': 0,
      'Зарплата': 0,
      'Расходники': 0,
      'Маркетинг': 0,
      'Налоги': 0,
      'Другое': 0,
    };

    filteredExpenses.forEach(expense => {
      if (expense.category && stats.hasOwnProperty(expense.category)) {
        stats[expense.category] += expense.amount;
      }
    });

    return stats;
  }, [filteredExpenses]);

  // Calculate expense statistics by responsible
  const responsibleStats: ResponsibleStats = React.useMemo(() => {
    const stats: ResponsibleStats = {};

    filteredExpenses.forEach(expense => {
      const responsibleName = getResponsibleName(expense.responsible);
      stats[responsibleName] = (stats[responsibleName] || 0) + expense.amount;
    });

    return stats;
  }, [filteredExpenses]);

  // Calculate total payouts
  const totalPayouts = React.useMemo(() => {
    return filteredPayouts.reduce((sum, payout) => sum + payout.amount, 0);
  }, [filteredPayouts]);

  // Calculate total expenses
  const totalExpenses = React.useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [filteredExpenses]);

  // Get seller name by username
  const getSellerName = (username: string) => {
    const user = users.find(u => u.username === username);
    return user ? user.name : username;
  };

  // Get responsible name by ID
  const getResponsibleName = (responsibleId: string) => {
    const user = users.find(u => u.id === responsibleId);
    return user ? user.name : responsibleId;
  };

  const resetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setSelectedSeller('all');
    setSelectedExpenseCategory('all');
    setSelectedResponsible('all');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Аналитика
          </h1>
          <p className="text-muted-foreground">
            Статистика заказов, выплат и расходов
          </p>
        </div>
        <Button onClick={resetFilters} variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Сбросить фильтры
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div>
              <Label htmlFor="date-from">Дата от</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="date-to">Дата до</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="seller">Продавец</Label>
              <Select value={selectedSeller} onValueChange={setSelectedSeller}>
                <SelectTrigger>
                  <SelectValue placeholder="Все продавцы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все продавцы</SelectItem>
                  {users
                    .filter(user => user.role === 'Продавец')
                    .map(user => (
                      <SelectItem key={user.username} value={user.username}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="expense-category">Категория расходов</Label>
              <Select value={selectedExpenseCategory} onValueChange={setSelectedExpenseCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Все категории" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все категории</SelectItem>
                  <SelectItem value="Аренда">Аренда</SelectItem>
                  <SelectItem value="Зарплата">Зарплата</SelectItem>
                  <SelectItem value="Расходники">Расходники</SelectItem>
                  <SelectItem value="Маркетинг">Маркетинг</SelectItem>
                  <SelectItem value="Налоги">Налоги</SelectItem>
                  <SelectItem value="Другое">Другое</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="responsible">Ответственный</Label>
              <Select value={selectedResponsible} onValueChange={setSelectedResponsible}>
                <SelectTrigger>
                  <SelectValue placeholder="Все ответственные" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все ответственные</SelectItem>
                  {users
                    .filter(user => user.role === 'Администратор')
                    .map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2">
              <Badge variant="secondary" className="text-sm">
                {filteredOrders.length} заказов
              </Badge>
              <Badge variant="secondary" className="text-sm">
                {filteredExpenses.length} расходов
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Всего заказов</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orderStats.total}</div>
            <p className="text-xs text-muted-foreground">
              {filteredOrders.reduce((sum, order) => sum + order.price, 0).toLocaleString('ru-RU')} ₽
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие расходы</CardTitle>
            <Receipt className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {totalExpenses.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredExpenses.length} записей
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Общие выплаты</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {totalPayouts.toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredPayouts.length} выплат
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Чистая прибыль</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {(filteredOrders.reduce((sum, order) => sum + order.price, 0) - totalExpenses).toLocaleString('ru-RU')} ₽
            </div>
            <p className="text-xs text-muted-foreground">
              Доходы - Расходы
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Order Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Статистика по статусам заказов</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Статус</TableHead>
                <TableHead>Количество</TableHead>
                <TableHead>Процент</TableHead>
                <TableHead>Сумма</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <Badge variant="outline">Добавлен</Badge>
                </TableCell>
                <TableCell>{orderStats.added}</TableCell>
                <TableCell>
                  {orderStats.total > 0 ? Math.round((orderStats.added / orderStats.total) * 100) : 0}%
                </TableCell>
                <TableCell>
                  {filteredOrders
                    .filter(order => order.status === 'Добавлен')
                    .reduce((sum, order) => sum + order.price, 0)
                    .toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="default">Готов</Badge>
                </TableCell>
                <TableCell>
                  {filteredOrders.filter(order => order.status === 'Готов').length}
                </TableCell>
                <TableCell>
                  {orderStats.total > 0 ? Math.round((filteredOrders.filter(order => order.status === 'Готов').length / orderStats.total) * 100) : 0}%
                </TableCell>
                <TableCell>
                  {filteredOrders
                    .filter(order => order.status === 'Готов')
                    .reduce((sum, order) => sum + order.price, 0)
                    .toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="secondary">Отправлен</Badge>
                </TableCell>
                <TableCell>{orderStats.shipped}</TableCell>
                <TableCell>
                  {orderStats.total > 0 ? Math.round((orderStats.shipped / orderStats.total) * 100) : 0}%
                </TableCell>
                <TableCell>
                  {filteredOrders
                    .filter(order => order.status === 'Отправлен')
                    .reduce((sum, order) => sum + order.price, 0)
                    .toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="default">Исполнен</Badge>
                </TableCell>
                <TableCell>{orderStats.completed}</TableCell>
                <TableCell>
                  {orderStats.total > 0 ? Math.round((orderStats.completed / orderStats.total) * 100) : 0}%
                </TableCell>
                <TableCell>
                  {filteredOrders
                    .filter(order => order.status === 'Исполнен')
                    .reduce((sum, order) => sum + order.price, 0)
                    .toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="destructive">Отменен</Badge>
                </TableCell>
                <TableCell>{orderStats.cancelled}</TableCell>
                <TableCell>
                  {orderStats.total > 0 ? Math.round((orderStats.cancelled / orderStats.total) * 100) : 0}%
                </TableCell>
                <TableCell>
                  {filteredOrders
                    .filter(order => order.status === 'Отменен')
                    .reduce((sum, order) => sum + order.price, 0)
                    .toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <Badge variant="outline">Возврат</Badge>
                </TableCell>
                <TableCell>{orderStats.returned}</TableCell>
                <TableCell>
                  {orderStats.total > 0 ? Math.round((orderStats.returned / orderStats.total) * 100) : 0}%
                </TableCell>
                <TableCell>
                  {filteredOrders
                    .filter(order => order.status === 'Возврат')
                    .reduce((sum, order) => sum + order.price, 0)
                    .toLocaleString('ru-RU')} ₽
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Breakdown by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Расходы по категориям</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Категория</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Процент от общих расходов</TableHead>
                <TableHead>Количество записей</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(expenseStats).map(([category, amount]) => {
                const categoryExpenses = filteredExpenses.filter(expense => expense.category === category);
                const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                
                return (
                  <TableRow key={category}>
                    <TableCell>{category}</TableCell>
                    <TableCell className="font-medium">
                      {amount.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell>{percentage}%</TableCell>
                    <TableCell>{categoryExpenses.length}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-bold">
                <TableCell>Итого расходов</TableCell>
                <TableCell>
                  {totalExpenses.toLocaleString('ru-RU')} ₽
                </TableCell>
                <TableCell>100%</TableCell>
                <TableCell>{filteredExpenses.length}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Expense Breakdown by Responsible */}
      <Card>
        <CardHeader>
          <CardTitle>Расходы по ответственным</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ответственный</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Процент от общих расходов</TableHead>
                <TableHead>Количество записей</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(responsibleStats).map(([responsible, amount]) => {
                const responsibleExpenses = filteredExpenses.filter(expense => getResponsibleName(expense.responsible) === responsible);
                const percentage = totalExpenses > 0 ? Math.round((amount / totalExpenses) * 100) : 0;
                
                return (
                  <TableRow key={responsible}>
                    <TableCell>{responsible}</TableCell>
                    <TableCell className="font-medium">
                      {amount.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell>{percentage}%</TableCell>
                    <TableCell>{responsibleExpenses.length}</TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="font-bold">
                <TableCell>Итого расходов</TableCell>
                <TableCell>
                  {totalExpenses.toLocaleString('ru-RU')} ₽
                </TableCell>
                <TableCell>100%</TableCell>
                <TableCell>{filteredExpenses.length}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Последние расходы</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Категория</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Ответственный</TableHead>
                <TableHead>Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>
                    {format(new Date(expense.date), 'dd.MM.yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{expense.category}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {expense.amount.toLocaleString('ru-RU')} ₽
                  </TableCell>
                  <TableCell>{getResponsibleName(expense.responsible)}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {expense.comment || '–'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Recent Payouts */}
      <Card>
        <CardHeader>
          <CardTitle>Последние выплаты</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Продавец</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Количество заказов</TableHead>
                <TableHead>Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayouts
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10)
                .map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>
                    {format(new Date(payout.date), 'dd.MM.yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell>{getSellerName(payout.seller)}</TableCell>
                  <TableCell className="font-medium">
                    {payout.amount.toLocaleString('ru-RU')} ₽
                  </TableCell>
                  <TableCell>{payout.orderCount}</TableCell>
                  <TableCell>
                    <Badge 
                      variant={
                        payout.status === 'completed' ? 'default' :
                        payout.status === 'processing' ? 'secondary' :
                        payout.status === 'cancelled' ? 'destructive' : 'outline'
                      }
                    >
                      {payout.status === 'pending' ? 'Ожидает' :
                       payout.status === 'processing' ? 'В обработке' :
                       payout.status === 'completed' ? 'Завершено' :
                       payout.status === 'cancelled' ? 'Отменено' : payout.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 