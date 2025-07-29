'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { Order, OrderStatus, User, Expense, Payout, PayoutStatus, Debt } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { PrinterDashboard } from '@/components/printer/PrinterDashboard';
import { AdminOrderList } from '@/components/admin/AdminOrderList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpensesList } from '@/components/admin/ExpensesList';
import { PayoutsList } from '@/components/admin/PayoutsList';
import AIAnalytics from '@/components/admin/AIAnalytics';
import { Analytics } from '@/components/admin/Analytics';
import { optimizedFetcher, swrConfig, cacheManager, getCacheStatus } from '@/lib/cache';

type DashboardRootProps = {
  initialUser: Omit<User, 'password_hash'> | undefined;
}

export default function DashboardRoot({ initialUser }: DashboardRootProps) {
  if (!initialUser) {
    return null;
  }

  const { toast } = useToast();
  const [errorCount, setErrorCount] = React.useState(0);
  const [lastErrorTime, setLastErrorTime] = React.useState(0);

  // Предотвращаем множественные ошибки
  const handleError = React.useCallback((error: Error, type: string) => {
    const now = Date.now();
    if (now - lastErrorTime < 5000) { // Не показываем ошибки чаще чем раз в 5 секунд
      return;
    }
    
    setLastErrorTime(now);
    setErrorCount(prev => prev + 1);
    
    console.error(`Ошибка загрузки ${type}:`, error);
    
    // Показываем toast только для первой ошибки
    if (errorCount === 0) {
      toast({ 
        title: `Ошибка загрузки ${type}`, 
        description: 'Проверьте подключение к интернету и попробуйте снова', 
        variant: 'destructive' 
      });
    }
  }, [toast, errorCount, lastErrorTime]);

  // Сбрасываем счетчик ошибок при успешной загрузке
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setErrorCount(0);
    }, 30000); // Сбрасываем через 30 секунд

    return () => clearTimeout(timer);
  }, []);

  // Показываем статус кэша в консоли для отладки
  React.useEffect(() => {
    const status = getCacheStatus();
    console.log('📊 Статус кэша:', status);
  }, []);

  // Оптимизированные запросы с улучшенной конфигурацией
  const { data: orders = [], error: ordersError, isLoading: ordersLoading } = useSWR<Order[]>(
    '/api/orders', 
    optimizedFetcher, 
    {
      ...swrConfig,
      fallbackData: cacheManager.get('orders') || [],
      onError: (error) => handleError(error, 'заказов'),
    }
  );
  
  const { data: expenses = [], error: expensesError } = useSWR<Expense[]>(
    initialUser.role === 'Администратор' ? '/api/expenses' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('expenses') || [],
      onError: (error) => handleError(error, 'расходов'),
    }
  );

  const { data: payouts = [], error: payoutsError } = useSWR<Payout[]>(
    (initialUser.role === 'Администратор' || initialUser.role === 'Продавец') ? '/api/payouts' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('payouts') || [],
      onError: (error) => handleError(error, 'выводов'),
    }
  );

  const { data: debts = [], error: debtsError } = useSWR<Debt[]>(
    initialUser.role === 'Администратор' ? '/api/debts' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('debts') || [],
      onError: (error) => handleError(error, 'долгов'),
    }
  );

  const { data: users = [], error: usersError } = useSWR<User[]>(
    initialUser.role === 'Администратор' ? '/api/users' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('users') || [],
      onError: (error) => handleError(error, 'пользователей'),
    }
  );

  // Мемоизированные функции для предотвращения лишних ререндеров
  const handleAddOrder = React.useCallback(async (newOrderData: Omit<Order, 'id' | 'orderDate' | 'seller'>) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newOrderData,
          seller: initialUser.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка добавления заказа');
      }

      const newOrder = await response.json();
      
      // Оптимистичное обновление
      mutate('/api/orders', (currentOrders: Order[] = []) => [newOrder, ...currentOrders], false);
      
      // Обновляем кэш
      const currentOrders = (cacheManager.get('orders') as Order[]) || [];
      cacheManager.set('orders', [newOrder, ...currentOrders]);
      
      toast({
        title: 'Заказ добавлен',
        description: `Заказ #${newOrder.orderNumber} успешно создан`,
      });
    } catch (error) {
      console.error('Ошибка добавления заказа:', error);
      toast({
        title: 'Ошибка добавления заказа',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  }, [initialUser.username, toast]);

  const handleUpdateOrderStatus = React.useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления статуса');
      }

      const updatedOrder = await response.json();
      
      // Оптимистичное обновление
      mutate('/api/orders', (currentOrders: Order[] = []) => 
        currentOrders.map(order => 
          order.id === orderId ? { ...order, status: newStatus, ready_at: updatedOrder.ready_at } : order
        ), false
      );
      
      // Обновляем кэш
      const currentOrders = (cacheManager.get('orders') as Order[]) || [];
      const updatedOrders = currentOrders.map((order: Order) => 
        order.id === orderId ? { ...order, status: newStatus, ready_at: updatedOrder.ready_at } : order
      );
      cacheManager.set('orders', updatedOrders);
      
      toast({
        title: 'Статус обновлен',
        description: `Статус заказа изменен на "${newStatus}"`,
      });
    } catch (error) {
      console.error('Ошибка обновления статуса:', error);
      toast({
        title: 'Ошибка обновления статуса',
        description: 'Не удалось обновить статус заказа',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleAddExpense = React.useCallback(async (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpenseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка добавления расхода');
      }

      const newExpense = await response.json();
      
      // Оптимистичное обновление
      mutate('/api/expenses', (currentExpenses: Expense[] = []) => [newExpense, ...currentExpenses], false);
      
      // Обновляем кэш
      const currentExpenses = (cacheManager.get('expenses') as Expense[]) || [];
      cacheManager.set('expenses', [newExpense, ...currentExpenses]);
      
      toast({
        title: 'Расход добавлен',
        description: `Расход на ${newExpense.amount} ₽ успешно добавлен`,
      });
    } catch (error) {
      console.error('Ошибка добавления расхода:', error);
      toast({
        title: 'Ошибка добавления расхода',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleDebtUpdate = React.useCallback(() => {
    mutate('/api/debts');
  }, []);

  const handleUpdatePayoutStatus = React.useCallback(async (payoutId: string, newStatus: PayoutStatus) => {
    try {
      const response = await fetch(`/api/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления статуса выплаты');
      }

      const updatedPayout = await response.json();
      
      // Оптимистичное обновление
      mutate('/api/payouts', (currentPayouts: Payout[] = []) => 
        currentPayouts.map(payout => 
          payout.id === payoutId ? { ...payout, status: newStatus } : payout
        ), false
      );
      
      // Обновляем кэш
      const currentPayouts = (cacheManager.get('payouts') as Payout[]) || [];
      const updatedPayouts = currentPayouts.map((payout: Payout) => 
        payout.id === payoutId ? { ...payout, status: newStatus } : payout
      );
      cacheManager.set('payouts', updatedPayouts);
      
      toast({
        title: 'Статус выплаты обновлен',
        description: `Статус выплаты изменен на "${newStatus}"`,
      });
    } catch (error) {
      console.error('Ошибка обновления статуса выплаты:', error);
      toast({
        title: 'Ошибка обновления статуса',
        description: 'Не удалось обновить статус выплаты',
        variant: 'destructive',
      });
    }
  }, [toast]);

  const handleCancelOrder = React.useCallback((orderNumber: string) => {
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order?.id) {
      handleUpdateOrderStatus(order.id, 'Отменен');
    }
  }, [orders, handleUpdateOrderStatus]);

  const handleReturnOrder = React.useCallback((orderNumber: string) => {
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order?.id) {
      handleUpdateOrderStatus(order.id, 'Возврат');
    }
  }, [orders, handleUpdateOrderStatus]);

  const handlePayout = React.useCallback(async (orderNumbers: string[]) => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumbers,
          seller: initialUser.username,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Ошибка создания выплаты');
      }

      const newPayout = await response.json();
      
      // Оптимистичное обновление
      mutate('/api/payouts', (currentPayouts: Payout[] = []) => [newPayout, ...currentPayouts], false);
      
      // Обновляем кэш
      const currentPayouts = (cacheManager.get('payouts') as Payout[]) || [];
      cacheManager.set('payouts', [newPayout, ...currentPayouts]);
      
      toast({
        title: 'Выплата создана',
        description: `Выплата на ${newPayout.amount} ₽ успешно создана`,
      });
    } catch (error) {
      console.error('Ошибка создания выплаты:', error);
      toast({
        title: 'Ошибка создания выплаты',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  }, [initialUser.username, toast]);

  // Вспомогательные функции
  const findOrder = React.useCallback((orderNumber: string) => {
    return orders.find(order => order.orderNumber === orderNumber);
  }, [orders]);

  const findOrders = React.useCallback((orderNumbers: string[]) => {
    return orders.filter(order => orderNumbers.includes(order.orderNumber));
  }, [orders]);

  // Компонент-заглушка для загрузки
  const PlaceholderComponent = React.memo(({ title, description }: { title: string, description: string }) => (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    </div>
  ));

  // Рендеринг в зависимости от роли пользователя
  if (initialUser.role === 'Продавец') {
    return (
      <AppLayout currentUser={initialUser}>
        {(activeView: string) => (
          <Dashboard
            user={initialUser}
            orders={orders}
            isLoading={ordersLoading}
            onAddOrder={handleAddOrder}
            onCancelOrder={handleCancelOrder}
            onReturnOrder={handleReturnOrder}
            onPayout={handlePayout}
            onUpdateStatus={handleUpdateOrderStatus}
            findOrder={findOrder}
            findOrders={findOrders}
          />
        )}
      </AppLayout>
    );
  }

  if (initialUser.role === 'Принтовщик') {
    return (
      <AppLayout currentUser={initialUser}>
        {(activeView: string) => (
          <PrinterDashboard
            currentUser={initialUser}
            allOrders={orders}
            onUpdateStatus={handleUpdateOrderStatus}
            isLoading={ordersLoading}
          />
        )}
      </AppLayout>
    );
  }

  if (initialUser.role === 'Администратор') {
    return (
      <AppLayout currentUser={initialUser}>
        {(activeView: string) => {
          switch (activeView) {
            case 'admin-orders':
              return (
                <AdminOrderList 
                  allOrders={orders} 
                  allUsers={users}
                />
              );
            case 'admin-expenses':
              return (
                <ExpensesList 
                  allExpenses={expenses} 
                  allUsers={users}
                  onAddExpense={handleAddExpense}
                  currentUser={initialUser}
                  debts={debts}
                  onDebtUpdate={handleDebtUpdate}
                />
              );
            case 'admin-payouts':
              return (
                <PayoutsList 
                  allPayouts={payouts} 
                  allUsers={users}
                  onUpdateStatus={handleUpdatePayoutStatus}
                  currentUser={initialUser}
                />
              );
            case 'admin-analytics':
              return (
                <Analytics 
                  orders={orders} 
                  expenses={expenses} 
                  payouts={payouts}
                  users={users}
                />
              );
            case 'admin-ai-analytics':
              return (
                <AIAnalytics 
                  orders={orders} 
                  expenses={expenses}
                />
              );
            default:
              return (
                <div className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-bold">Панель администратора</h1>
                    <p className="text-muted-foreground">
                      Управление заказами, расходами и аналитика
                    </p>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    <Card>
                      <CardHeader>
                        <CardTitle>Заказы</CardTitle>
                        <CardDescription>
                          Всего заказов: {orders.length}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AdminOrderList 
                          allOrders={orders} 
                          allUsers={users}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Расходы</CardTitle>
                        <CardDescription>
                          Всего расходов: {expenses.length}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ExpensesList 
                          allExpenses={expenses} 
                          allUsers={users}
                          onAddExpense={handleAddExpense}
                          currentUser={initialUser}
                          debts={debts}
                          onDebtUpdate={handleDebtUpdate}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>Выплаты</CardTitle>
                        <CardDescription>
                          Всего выплат: {payouts.length}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PayoutsList 
                          allPayouts={payouts} 
                          allUsers={users}
                          onUpdateStatus={handleUpdatePayoutStatus}
                          currentUser={initialUser}
                        />
                      </CardContent>
                    </Card>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                      <CardHeader>
                        <CardTitle>Аналитика</CardTitle>
                        <CardDescription>
                          Статистика и аналитика
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Analytics 
                          orders={orders} 
                          expenses={expenses} 
                          payouts={payouts}
                          users={users}
                        />
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle>AI Аналитика</CardTitle>
                        <CardDescription>
                          Искусственный интеллект для анализа данных
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <AIAnalytics 
                          orders={orders} 
                          expenses={expenses}
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              );
          }
        }}
      </AppLayout>
    );
  }

  return (
    <AppLayout currentUser={initialUser}>
      {(activeView: string) => (
        <PlaceholderComponent 
          title="Неизвестная роль" 
          description="Ваша роль не поддерживается в системе" 
        />
      )}
    </AppLayout>
  );
}
