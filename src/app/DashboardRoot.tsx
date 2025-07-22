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

  // Показываем статус кэша в консоли для отладки
  React.useEffect(() => {
    const status = getCacheStatus();
    console.log('📊 Статус кэша:', status);
  }, []);

  // Получаем заказы из localStorage (только на клиенте)
  const getOrdersFromStorage = () => {
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('orders');
        if (raw) return JSON.parse(raw);
      } catch {}
    }
    return [];
  };

  // SWR с fallbackData из localStorage и обновлением localStorage при успехе
  const { data: orders = [], error: ordersError, isLoading: ordersLoading } = useSWR<Order[]>(
    '/api/orders',
    optimizedFetcher,
    {
      ...swrConfig,
      fallbackData: getOrdersFromStorage(),
      onSuccess: (data) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('orders', JSON.stringify(data));
          } catch {}
        }
      },
    }
  );
  
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
      const lastUpdate = cacheManager.getLastUpdate();
      const timeSinceUpdate = Date.now() - lastUpdate;
      
      if (timeSinceUpdate < 60000) { // Меньше минуты
        toast({ 
          title: 'Данные загружены', 
          description: 'Используются кэшированные данные для быстрой работы', 
          duration: 2000
        });
      }
    }
  }, [ordersLoading, orders.length, toast]);

  // Оптимистичное добавление заказа с кэшированием
  const handleAddOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate' | 'seller'>) => {
    // Создаем временный заказ для оптимистичного обновления
    const tempOrder: Order = {
      id: `temp-${Date.now()}`,
      orderDate: new Date(),
      seller: initialUser.username,
      ...newOrderData,
    };

    // Оптимистично обновляем UI и кэш
    mutate('/api/orders', (currentOrders: Order[] = []) => [tempOrder, ...currentOrders], false);
    cacheManager.set('orders', [tempOrder, ...orders]);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        // Откатываем оптимистичное обновление при ошибке
        mutate('/api/orders');
        cacheManager.set('orders', orders);
        
        let errorMessage = responseData.message || 'Произошла ошибка';
        
        if (responseData.errors) {
          const errorDetails = responseData.errors.map((e: any) => {
            const field = e.path.join('.');
            const message = e.message;
            // Переводим названия полей на русский
            const fieldNames: { [key: string]: string } = {
              'orderNumber': 'Номер заказа',
              'shipmentNumber': 'Номер отправления',
              'productType': 'Тип товара',
              'size': 'Размер',
              'price': 'Цена',
              'comment': 'Комментарий',
              'photos': 'Фотографии'
            };
            const fieldName = fieldNames[field] || field;
            return `${fieldName}: ${message}`;
          }).join(', ');
          errorMessage += `: ${errorDetails}`;
        } else if (responseData.error) {
          errorMessage += `: ${responseData.error}`;
        }
        
        throw new Error(errorMessage);
      }
      
      // Обновляем данные с сервера и кэш
      mutate('/api/orders');
      toast({ title: 'Заказ успешно добавлен' });
    } catch (error: any) {
      toast({ 
        title: 'Ошибка добавления заказа', 
        description: error.message,
        variant: 'destructive' 
      });
    }
  };
  
  // Оптимистичное обновление статуса заказа с кэшированием
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    // Оптимистично обновляем UI и кэш
    const updatedOrders = orders.map(order => 
      order.id === orderId ? { ...order, status: newStatus } : order
    );
    
    mutate('/api/orders', updatedOrders, false);
    cacheManager.set('orders', updatedOrders);

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      
      if (!response.ok) {
        const err = await response.json();
        // Откатываем при ошибке
        mutate('/api/orders');
        cacheManager.set('orders', orders);
        throw new Error(err.message || 'Server error');
      }
      
      // Обновляем данные с сервера
      mutate('/api/orders');
      toast({ 
        title: 'Статус заказа обновлен', 
        description: `Заказ получил новый статус: "${newStatus}".` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Ошибка обновления статуса', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };
  
  // Оптимизированное добавление расхода
  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    try {
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpenseData),
      });
      
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Server error');
      }
      
      // Обновляем данные
      mutate('/api/expenses');
      mutate('/api/debts');
      toast({ title: 'Расход успешно добавлен' });
    } catch (error: any) {
      toast({ 
        title: 'Ошибка добавления расхода', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  }

  const handleDebtUpdate = () => {
    mutate('/api/debts');
  };

  const handleUpdatePayoutStatus = async (payoutId: string, newStatus: PayoutStatus) => {
    try {
      const response = await fetch(`/api/payouts/${payoutId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Server error');
      }
      mutate('/api/payouts');
      toast({ title: 'Статус вывода обновлен' });
    } catch (error: any) {
      toast({ 
        title: 'Ошибка обновления статуса', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  }

  const handleCancelOrder = (orderNumber: string) => {
    const order = findOrder(orderNumber);
    if (order?.id) handleUpdateOrderStatus(order.id, 'Отменен');
  };
  
  const handleReturnOrder = (orderNumber: string) => {
    const order = findOrder(orderNumber);
    if (order?.id) handleUpdateOrderStatus(order.id, 'Возврат');
  };

  const handlePayout = async (orderNumbers: string[]) => {
    try {
      const selectedOrders = findOrders(orderNumbers);
      const totalAmount = selectedOrders.reduce((sum, order) => sum + order.price, 0);
      
      const payoutData = {
        orderNumbers,
        amount: totalAmount,
        orderCount: selectedOrders.length,
        seller: initialUser.username,
        comment: `Выплата по заказам: ${orderNumbers.join(', ')}`,
      };

      const response = await fetch('/api/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payoutData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Ошибка создания выплаты');
      }

      // Обновляем данные
      mutate('/api/orders');
      mutate('/api/payouts');
      
      toast({ 
        title: 'Выплата создана', 
        description: `Создана выплата на сумму ${totalAmount.toLocaleString('ru-RU')} ₽ по ${selectedOrders.length} заказ(ам). Заказы отмечены как "Исполнен".` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Ошибка создания выплаты', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  // Мемоизированные функции поиска
  const findOrder = React.useCallback((orderNumber: string): Order | undefined => {
    return orders.find((order: Order) => order.orderNumber === orderNumber);
  }, [orders]);
  
  const findOrders = React.useCallback((orderNumbers: string[]): Order[] => {
    return orders.filter((order: Order) => orderNumbers.includes(order.orderNumber));
  }, [orders]);

  const PlaceholderComponent = ({ title, description }: { title: string, description: string }) => (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Этот раздел находится в разработке. Полный функционал будет добавлен в следующих итерациях.</p>
      </CardContent>
    </Card>
  )

  return (
    <AppLayout currentUser={initialUser}>
      {(activeView: string) => {
        if (initialUser.role === 'Продавец') {
           return <Dashboard 
            user={initialUser} 
            orders={orders}
            isLoading={ordersLoading}
            onAddOrder={handleAddOrder} 
            onCancelOrder={handleCancelOrder}
            onReturnOrder={handleReturnOrder}
            findOrder={findOrder}
            findOrders={findOrders}
            onPayout={handlePayout}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        }
        if (initialUser.role === 'Принтовщик') {
          return (
             <PrinterDashboard
                currentUser={initialUser}
                onUpdateStatus={handleUpdateOrderStatus}
                allOrders={orders}
                isLoading={ordersLoading}
              />
          )
        }
        if (initialUser.role === 'Администратор') {
          switch (activeView) {
            case 'admin-orders':
              return <AdminOrderList allOrders={orders} allUsers={users} />;
            case 'admin-expenses':
              return <ExpensesList 
                        allExpenses={expenses} 
                        allUsers={users} 
                        onAddExpense={handleAddExpense}
                        currentUser={initialUser}
                        debts={debts}
                        onDebtUpdate={handleDebtUpdate}
                      />;
            case 'admin-payouts':
              return <PayoutsList 
                        allPayouts={payouts} 
                        allUsers={users} 
                        onUpdateStatus={handleUpdatePayoutStatus}
                        currentUser={initialUser}
                      />;
            case 'admin-analytics':
              return <Analytics 
                        orders={orders} 
                        users={users} 
                        expenses={expenses} 
                        payouts={payouts} 
                      />;
            case 'admin-ai-analytics':
               return <AIAnalytics orders={orders} expenses={expenses} />;
            default:
              return <AdminOrderList allOrders={orders} allUsers={users} />;
          }
        }
        return null;
      }}
    </AppLayout>
  );
}
