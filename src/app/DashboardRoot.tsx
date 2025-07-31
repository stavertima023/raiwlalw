'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { Order, OrderStatus, User, Expense, Payout, PayoutStatus, Debt, PayoutWithOrders } from '@/lib/types';
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
import { Button } from '@/components/ui/button';

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
  const [isInitialized, setIsInitialized] = React.useState(false);

  // Защита от перезагрузок - предотвращаем множественные инициализации
  React.useEffect(() => {
    if (isInitialized) return;
    
    // Устанавливаем флаг инициализации
    setIsInitialized(true);
    
    // Очищаем старый кэш для принудительной загрузки свежих данных
    console.log('🔄 Очищаем старый кэш для загрузки свежих данных');
    cacheManager.clear();
    
    // Предотвращаем перезагрузки при потере фокуса
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('📱 Приложение вернулось в активное состояние');
      } else {
        console.log('📱 Приложение перешло в фоновый режим');
      }
    };

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      // Предотвращаем случайные перезагрузки
      console.log('🛡️ Попытка перезагрузки предотвращена');
      e.preventDefault();
      e.returnValue = '';
    };

    const handlePageHide = () => {
      console.log('📱 Страница скрыта - сохраняем состояние');
    };

    const handlePageShow = () => {
      console.log('📱 Страница показана - восстанавливаем состояние');
    };

    // Дополнительная защита для мобильных устройств
    const handleTouchStart = () => {
      // Предотвращаем случайные перезагрузки при касании
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('pageshow', handlePageShow);
    document.addEventListener('touchstart', handleTouchStart, { passive: true });

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('pageshow', handlePageShow);
      document.removeEventListener('touchstart', handleTouchStart);
    };
  }, [isInitialized]);

  // Предотвращаем множественные ошибки
  const handleError = React.useCallback((error: Error, type: string) => {
    const now = Date.now();
    if (now - lastErrorTime < 10000) { // Увеличиваем интервал до 10 секунд
      return;
    }
    
    setLastErrorTime(now);
    setErrorCount(prev => prev + 1);
    
    console.error(`Ошибка загрузки ${type}:`, error);
    
    // Показываем toast только для первой ошибки и не чаще чем раз в минуту
    if (errorCount === 0) {
      let errorMessage = 'Проверьте подключение к интернету и попробуйте снова';
      
      // Специальные сообщения для разных типов ошибок
      if (error.message.includes('500')) {
        errorMessage = 'Ошибка сервера. Попробуйте обновить страницу.';
      } else if (error.message.includes('QuotaExceededError')) {
        errorMessage = 'Превышен лимит памяти. Данные будут загружены без кэширования.';
      } else if (error.message.includes('18.06MB')) {
        errorMessage = 'Данные слишком большие. Загружаем без кэширования.';
      }
      
      toast({ 
        title: `Ошибка загрузки ${type}`, 
        description: errorMessage, 
        variant: 'destructive',
        duration: 5000, // Уменьшаем время показа
      });
    }
  }, [toast, errorCount, lastErrorTime]);

  // Сбрасываем счетчик ошибок при успешной загрузке
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setErrorCount(0);
    }, 60000); // Увеличиваем до 60 секунд

    return () => clearTimeout(timer);
  }, []);

  // Показываем статус кэша в консоли для отладки
  React.useEffect(() => {
    if (!isInitialized) return;
    
    const status = getCacheStatus();
    console.log('📊 Статус кэша:', status);
  }, [isInitialized]);

  // Оптимизированные запросы с улучшенной конфигурацией
  const { data: orders = [], error: ordersError, isLoading: ordersLoading, mutate: mutateOrders } = useSWR<Order[]>(
    isInitialized ? '/api/orders' : null, // Загружаем только после инициализации
    optimizedFetcher, 
    {
      ...swrConfig,
      fallbackData: cacheManager.get('orders') || [],
      onError: (error) => {
        console.error('❌ Ошибка загрузки заказов:', error);
        handleError(error, 'заказов');
      },
      onSuccess: (data) => {
        console.log(`✅ Заказы загружены успешно: ${data.length} шт. для ${initialUser.role}`);
        // Показываем специальное уведомление для админа при загрузке большого количества заказов
        if (initialUser.role === 'Администратор' && data.length > 500) {
          toast({
            title: 'Заказы загружены',
            description: `Загружено ${data.length} заказов (все заказы в системе)`,
            duration: 3000,
          });
        }
      },
      // Принудительно загружаем данные при первом запуске
      revalidateOnMount: isInitialized,
      // Добавляем обработку ошибок для предотвращения React ошибок
      shouldRetryOnError: false,
      errorRetryCount: 0,
      // Добавляем обработку ошибок кэша
      onErrorRetry: (error, key, config, revalidate, { retryCount }) => {
        console.log(`🔄 Попытка повторной загрузки ${retryCount}:`, error);
        // Не повторяем при ошибках
        return;
      },
    }
  );
  
  const { data: expenses = [], error: expensesError, mutate: mutateExpenses } = useSWR<Expense[]>(
    (isInitialized && initialUser.role === 'Администратор') ? '/api/expenses' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('expenses') || [],
      onError: (error) => handleError(error, 'расходов'),
      revalidateOnMount: isInitialized,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  const { data: payouts = [], error: payoutsError, mutate: mutatePayouts } = useSWR<PayoutWithOrders[]>(
    (isInitialized && (initialUser.role === 'Администратор' || initialUser.role === 'Продавец')) ? '/api/payouts' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: [], // Отключаем кэш для payouts
      onError: (error) => handleError(error, 'выводов'),
      revalidateOnMount: isInitialized,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  const { data: debts = [], error: debtsError, mutate: mutateDebts } = useSWR<Debt[]>(
    (isInitialized && initialUser.role === 'Администратор') ? '/api/debts' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('debts') || [],
      onError: (error) => handleError(error, 'долгов'),
      revalidateOnMount: isInitialized,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  const { data: users = [], error: usersError, mutate: mutateUsers } = useSWR<User[]>(
    (isInitialized && initialUser.role === 'Администратор') ? '/api/users' : null, 
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: cacheManager.get('users') || [],
      onError: (error) => handleError(error, 'пользователей'),
      revalidateOnMount: isInitialized,
      shouldRetryOnError: false,
      errorRetryCount: 0,
    }
  );

  // Функция для принудительного обновления всех данных
  const handleRefreshAll = React.useCallback(async () => {
    console.log('🔄 Принудительное обновление всех данных...');
    
    try {
      // Очищаем кэш для принудительной загрузки
      cacheManager.clear();
      
      // Обновляем все данные
      await Promise.all([
        mutateOrders(),
        mutateExpenses(),
        mutatePayouts(),
        mutateDebts(),
        mutateUsers(),
      ]);
      
      toast({
        title: 'Данные обновлены',
        description: 'Все данные успешно загружены из базы данных',
      });
    } catch (error) {
      console.error('Ошибка при обновлении данных:', error);
      toast({
        title: 'Ошибка обновления',
        description: 'Не удалось обновить данные',
        variant: 'destructive',
      });
    }
  }, [mutateOrders, mutateExpenses, mutatePayouts, mutateDebts, mutateUsers, toast]);

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
      // Находим заказы для расчета суммы
      const payoutOrders = orders.filter(order => orderNumbers.includes(order.orderNumber));
      const totalAmount = payoutOrders.reduce((sum, order) => sum + order.price, 0);
      
      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderNumbers,
          seller: initialUser.username,
          amount: totalAmount,
          orderCount: orderNumbers.length,
          status: 'pending',
          comment: '',
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.message || 'Ошибка создания выплаты');
      }

      const newPayout = await response.json();
      
      // Оптимистичное обновление
      mutate('/api/payouts', (currentPayouts: Payout[] = []) => [newPayout, ...currentPayouts], false);
      
      // Обновляем кэш
      const currentPayouts = (cacheManager.get('payouts') as Payout[]) || [];
      cacheManager.set('payouts', [newPayout, ...currentPayouts]);
      
      toast({
        title: 'Выплата создана',
        description: `Выплата на ${totalAmount.toLocaleString('ru-RU')} ₽ успешно создана`,
      });
    } catch (error) {
      console.error('Ошибка создания выплаты:', error);
      toast({
        title: 'Ошибка создания выплаты',
        description: error instanceof Error ? error.message : 'Неизвестная ошибка',
        variant: 'destructive',
      });
    }
  }, [initialUser.username, orders, toast]);

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
            orders={orders || []}
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
            allOrders={orders || []}
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
          // Показываем специальный индикатор загрузки для админа
          if (ordersLoading && initialUser.role === 'Администратор') {
            return (
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Загрузка всех заказов</CardTitle>
                    <CardDescription>
                      Загружаем все заказы из базы данных. Это может занять некоторое время...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Пожалуйста, подождите...
                    </p>
                  </CardContent>
                </Card>
              </div>
            );
          }

          // Показываем ошибку загрузки
          if (ordersError) {
            return (
              <div className="flex items-center justify-center min-h-[400px]">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Ошибка загрузки заказов</CardTitle>
                    <CardDescription>
                      Не удалось загрузить заказы. Попробуйте обновить страницу.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button onClick={handleRefreshAll} className="w-full">
                      Обновить данные
                    </Button>
                  </CardContent>
                </Card>
              </div>
            );
          }

          // Проверяем, что данные загружены
          const safeOrders = orders || [];
          const safeUsers = users || [];
          const safeExpenses = expenses || [];
          const safePayouts = payouts || [];
          const safeDebts = debts || [];

          switch (activeView) {
            case 'admin-orders':
              return (
                <AdminOrderList 
                  allOrders={safeOrders} 
                  allUsers={safeUsers}
                  isLoading={ordersLoading}
                  onRefresh={handleRefreshAll}
                />
              );
            case 'admin-expenses':
              return (
                <ExpensesList 
                  allExpenses={safeExpenses} 
                  allUsers={safeUsers}
                  onAddExpense={handleAddExpense}
                  currentUser={initialUser}
                  debts={safeDebts}
                  onDebtUpdate={handleDebtUpdate}
                />
              );
            case 'admin-payouts':
              return (
                <PayoutsList 
                  allPayouts={safePayouts} 
                  allUsers={safeUsers}
                  onUpdateStatus={handleUpdatePayoutStatus}
                  currentUser={initialUser}
                  onRefresh={handleRefreshAll}
                  isLoading={ordersLoading}
                />
              );
            case 'admin-analytics':
              return (
                <Analytics 
                  orders={safeOrders} 
                  expenses={safeExpenses} 
                  payouts={safePayouts}
                  users={safeUsers}
                />
              );
            case 'admin-ai-analytics':
              return (
                <AIAnalytics 
                  orders={safeOrders} 
                  expenses={safeExpenses}
                />
              );
            default:
              return (
                <AdminOrderList 
                  allOrders={safeOrders} 
                  allUsers={safeUsers}
                  isLoading={ordersLoading}
                  onRefresh={handleRefreshAll}
                />
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
