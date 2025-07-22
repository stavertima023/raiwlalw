'use client';

import * as React from 'react';
import useSWR from 'swr';
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
import { useOrders } from '@/hooks/useOrders';

type DashboardRootProps = {
  initialUser: Omit<User, 'password_hash'> | undefined;
}

export default function DashboardRootOptimized({ initialUser }: DashboardRootProps) {
  if (!initialUser) {
    return null;
  }

  const { toast } = useToast();

  // Показываем статус кэша в консоли для отладки
  React.useEffect(() => {
    const status = getCacheStatus();
    console.log('📊 Статус кэша:', status);
  }, []);

  // Используем оптимизированный хук для заказов
  const {
    orders,
    ordersByStatus,
    readyOrders,
    loading: ordersLoading,
    error: ordersError,
    updateOrderStatus,
    addOrder,
    refresh: refreshOrders,
    cacheStatus
  } = useOrders({
    limit: initialUser.role === 'Принтовщик' ? 200 : 100, // Больше записей для принтовщика
    sortBy: 'orderDate',
    sortOrder: 'desc'
  });
  
  const { data: expenses = [], error: expensesError } = useSWR<Expense[]>(
    initialUser.role === 'Администратор' ? '/api/expenses' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('expenses') || [],
    }
  );

  const { data: payouts = [], error: payoutsError } = useSWR<Payout[]>(
    (initialUser.role === 'Администратор' || initialUser.role === 'Продавец') ? '/api/payouts' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('payouts') || [],
    }
  );

  const { data: debts = [], error: debtsError } = useSWR<Debt[]>(
    initialUser.role === 'Администратор' ? '/api/debts' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('debts') || [],
    }
  );

  const { data: users = [], error: usersError } = useSWR<User[]>(
    initialUser.role === 'Администратор' ? '/api/users' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('users') || [],
    }
  );

  // Обработка ошибок с улучшенными сообщениями
  React.useEffect(() => {
    if (ordersError) {
      console.error('Ошибка загрузки заказов:', ordersError);
      toast({ 
        title: 'Ошибка загрузки заказов', 
        description: 'Проверьте подключение к интернету и попробуйте снова', 
        variant: 'destructive' 
      });
    }
    if (expensesError) {
      console.error('Ошибка загрузки расходов:', expensesError);
      toast({ 
        title: 'Ошибка загрузки расходов', 
        description: expensesError.message, 
        variant: 'destructive' 
      });
    }
    if (payoutsError) {
      console.error('Ошибка загрузки выводов:', payoutsError);
      toast({ 
        title: 'Ошибка загрузки выводов', 
        description: payoutsError.message, 
        variant: 'destructive' 
      });
    }
    if (debtsError) {
      console.error('Ошибка загрузки долгов:', debtsError);
      toast({ 
        title: 'Ошибка загрузки долгов', 
        description: debtsError.message, 
        variant: 'destructive' 
      });
    }
    if (usersError) {
      console.error('Ошибка загрузки пользователей:', usersError);
      toast({ 
        title: 'Ошибка загрузки пользователей', 
        description: usersError.message, 
        variant: 'destructive' 
      });
    }
  }, [ordersError, expensesError, payoutsError, debtsError, usersError, toast]);

  // Показываем уведомление о загрузке из кэша
  React.useEffect(() => {
    if (!ordersLoading && orders.length > 0) {
      const lastUpdate = cacheStatus.lastUpdate;
      const timeSinceUpdate = Date.now() - lastUpdate;
      
      if (timeSinceUpdate < 60000) { // Меньше минуты
        toast({
          title: 'Данные загружены из кэша',
          description: `Последнее обновление: ${Math.round(timeSinceUpdate / 1000)} сек назад`,
          duration: 3000,
        });
      }
    }
  }, [ordersLoading, orders.length, cacheStatus.lastUpdate, toast]);

  // Обработчики для заказов
  const handleAddOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate' | 'seller'>) => {
    try {
      await addOrder(newOrderData);
      toast({
        title: 'Заказ добавлен',
        description: 'Заказ успешно добавлен в систему',
      });
    } catch (error) {
      toast({
        title: 'Ошибка добавления заказа',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast({
        title: 'Статус обновлен',
        description: `Статус заказа изменен на "${newStatus}"`,
      });
    } catch (error) {
      toast({
        title: 'Ошибка обновления статуса',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  };

  const handleCancelOrder = (orderNumber: string) => {
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order) {
      handleUpdateOrderStatus(order.id!, 'Отменен');
    }
  };

  const handleReturnOrder = (orderNumber: string) => {
    const order = orders.find(o => o.orderNumber === orderNumber);
    if (order) {
      handleUpdateOrderStatus(order.id!, 'Возврат');
    }
  };

  const handlePayout = async (orderNumbers: string[]) => {
    try {
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderNumbers }),
      });

      if (!response.ok) {
        throw new Error('Ошибка создания выплаты');
      }

      toast({
        title: 'Выплата создана',
        description: `Выплата для ${orderNumbers.length} заказов успешно создана`,
      });

      // Обновляем данные
      refreshOrders();
    } catch (error) {
      toast({
        title: 'Ошибка создания выплаты',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  };

  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newExpenseData),
      });

      if (!response.ok) {
        throw new Error('Ошибка добавления расхода');
      }

      toast({
        title: 'Расход добавлен',
        description: 'Расход успешно добавлен в систему',
      });

      // Обновляем данные
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Ошибка добавления расхода',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  };

  const handleDebtUpdate = () => {
    window.location.reload();
  };

  const handleUpdatePayoutStatus = async (payoutId: string, newStatus: PayoutStatus) => {
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

      toast({
        title: 'Статус выплаты обновлен',
        description: `Статус изменен на "${newStatus}"`,
      });

      window.location.reload();
    } catch (error) {
      toast({
        title: 'Ошибка обновления статуса выплаты',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  };

  const findOrder = (orderNumber: string) => orders.find(o => o.orderNumber === orderNumber);
  const findOrders = (orderNumbers: string[]) => orders.filter(o => orderNumbers.includes(o.orderNumber));

  // Вспомогательный компонент для заглушек
  const PlaceholderComponent = ({ title, description }: { title: string, description: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center h-32 text-muted-foreground">
          Функция в разработке
        </div>
      </CardContent>
    </Card>
  );

  // Определяем активное представление на основе роли пользователя
  const renderActiveView = (activeView: string) => {
    switch (activeView) {
      case 'orders':
        if (initialUser.role === 'Принтовщик') {
          return (
            <PrinterDashboard
              currentUser={initialUser}
              onUpdateStatus={handleUpdateOrderStatus}
              allOrders={orders}
              isLoading={ordersLoading}
            />
          );
        } else if (initialUser.role === 'Администратор') {
          return (
            <AdminOrderList
              allOrders={orders}
              allUsers={users}
            />
          );
        } else {
          return (
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
          );
        }

      case 'expenses':
        if (initialUser.role === 'Администратор') {
          return (
            <ExpensesList
              expenses={expenses}
              onAddExpense={handleAddExpense}
              onDebtUpdate={handleDebtUpdate}
              debts={debts}
            />
          );
        }
        return <PlaceholderComponent title="Расходы" description="Управление расходами" />;

      case 'payouts':
        if (initialUser.role === 'Администратор' || initialUser.role === 'Продавец') {
          return (
            <PayoutsList
              payouts={payouts}
              onUpdateStatus={handleUpdatePayoutStatus}
            />
          );
        }
        return <PlaceholderComponent title="Выплаты" description="Управление выплатами" />;

      case 'analytics':
        if (initialUser.role === 'Администратор') {
          return (
            <div className="space-y-6">
              <Analytics orders={orders} expenses={expenses} payouts={payouts} />
              <AIAnalytics orders={orders} expenses={expenses} />
            </div>
          );
        }
        return <PlaceholderComponent title="Аналитика" description="Аналитические данные" />;

      default:
        return <PlaceholderComponent title="Неизвестная страница" description="Страница не найдена" />;
    }
  };

  return (
    <AppLayout currentUser={initialUser}>
      {renderActiveView}
    </AppLayout>
  );
} 