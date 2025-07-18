'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { Order, OrderStatus, User, Expense, Payout, PayoutStatus, Debt, DebtPayment } from '@/lib/types';
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

const fetcher = (url: string) => fetch(url).then(res => {
    if (!res.ok) {
        const error = new Error('Произошла ошибка при загрузке данных');
        return res.json().then(info => {
            (error as any).info = info;
            throw error;
        });
    }
    return res.json();
});

type DashboardRootProps = {
  initialUser: Omit<User, 'password_hash'> | undefined;
}

export default function DashboardRoot({ initialUser }: DashboardRootProps) {
  // Defensive check to prevent client-side hydration errors
  if (!initialUser) {
    return null; // or a loading spinner
  }

  const { toast } = useToast();

  const { data: orders = [], error: ordersError } = useSWR<Order[]>('/api/orders', fetcher);
  
  const { data: expenses = [], error: expensesError } = useSWR<Expense[]>(
    initialUser.role === 'Администратор' ? '/api/expenses' : null, 
    fetcher
  );

  const { data: payouts = [], error: payoutsError } = useSWR<Payout[]>(
    (initialUser.role === 'Администратор' || initialUser.role === 'Продавец') ? '/api/payouts' : null, 
    fetcher
  );

  const { data: users = [], error: usersError } = useSWR<User[]>(
    initialUser.role === 'Администратор' ? '/api/users' : null, 
    fetcher
  );

  const { data: debts = [], error: debtsError } = useSWR<Debt[]>(
    initialUser.role === 'Администратор' ? '/api/debts' : null, 
    fetcher
  );

  const { data: debtPayments = [], error: debtPaymentsError } = useSWR<DebtPayment[]>(
    initialUser.role === 'Администратор' ? '/api/debts/payments' : null, 
    fetcher
  );

  // Initialize debts if they don't exist (for administrators)
  React.useEffect(() => {
    if (initialUser.role === 'Администратор' && debts && debts.length === 0) {
      const initializeDebts = async () => {
        try {
          const response = await fetch('/api/debts/init', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          });
          
          if (response.ok) {
            mutate('/api/debts');
          }
        } catch (error) {
          console.error('Failed to initialize debts:', error);
        }
      };
      
      initializeDebts();
    }
  }, [initialUser.role, debts, mutate]);

  React.useEffect(() => {
    if (ordersError) {
      toast({ title: 'Ошибка загрузки заказов', description: ordersError.message, variant: 'destructive' });
    }
    if (expensesError) {
      toast({ title: 'Ошибка загрузки расходов', description: expensesError.message, variant: 'destructive' });
    }
    if (payoutsError) {
      toast({ title: 'Ошибка загрузки выводов', description: payoutsError.message, variant: 'destructive' });
    }
    if (usersError) {
      toast({ title: 'Ошибка загрузки пользователей', description: usersError.message, variant: 'destructive' });
    }
    if (debtsError) {
      toast({ title: 'Ошибка загрузки долгов', description: debtsError.message, variant: 'destructive' });
    }
    if (debtPaymentsError) {
      toast({ title: 'Ошибка загрузки истории погашений', description: debtPaymentsError.message, variant: 'destructive' });
    }
  }, [ordersError, expensesError, payoutsError, usersError, debtsError, debtPaymentsError, toast]);

  const handleAddOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate' | 'seller'>) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('Order creation failed:', responseData);
        
        // Build detailed error message
        let errorMessage = responseData.message || 'Произошла ошибка';
        
        if (responseData.errors) {
          // Zod validation errors
          const errorDetails = responseData.errors.map((e: any) => 
            `${e.path.join('.')}: ${e.message}`
          ).join(', ');
          errorMessage += `: ${errorDetails}`;
        } else if (responseData.error) {
          // Database or other errors
          errorMessage += `: ${responseData.error}`;
        }
        
        throw new Error(errorMessage);
      }
      
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
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
        const response = await fetch(`/api/orders/${orderId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || 'Server error');
        }
        mutate('/api/orders');
        toast({ title: 'Статус заказа обновлен', description: `Заказ получил новый статус: "${newStatus}".` });
    } catch (error: any) {
       toast({ title: 'Ошибка обновления статуса', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    try {
      console.log('Sending expense data to API:', newExpenseData);
      
      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newExpenseData),
      });
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const err = await response.json();
        console.error('API error response:', err);
        throw new Error(err.message || 'Server error');
      }
      
      const result = await response.json();
      console.log('API success response:', result);
      
      mutate('/api/expenses');
      toast({ title: 'Расход успешно добавлен' });
    } catch (error: any) {
      console.error('Error in handleAddExpense:', error);
      toast({ title: 'Ошибка добавления расхода', description: error.message, variant: 'destructive' });
    }
  };

  const handlePayDebt = async (debtId: string, amount: number, personName: string, comment?: string, receiptPhoto?: string) => {
    try {
      const paymentData = {
        debtId,
        amount,
        personName,
        comment,
        receiptPhoto,
      };

      const response = await fetch('/api/debts/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Server error');
      }

      mutate('/api/debts');
      mutate('/api/debts/payments');
      toast({ title: 'Долг успешно погашен' });
    } catch (error: any) {
      toast({ title: 'Ошибка погашения долга', description: error.message, variant: 'destructive' });
    }
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
      toast({ title: 'Ошибка обновления статуса', description: error.message, variant: 'destructive' });
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

      // Refresh both orders and payouts data
      mutate('/api/orders');
      mutate('/api/payouts');
      
      toast({ 
        title: 'Выплата создана', 
        description: `Создана выплата на сумму ${(totalAmount || 0).toLocaleString('ru-RU')} ₽ по ${selectedOrders.length} заказ(ам). Заказы отмечены как "Исполнен".` 
      });
    } catch (error: any) {
      toast({ 
        title: 'Ошибка создания выплаты', 
        description: error.message, 
        variant: 'destructive' 
      });
    }
  };

  const findOrder = (orderNumber: string): Order | undefined => {
    return orders.find((order: Order) => order.orderNumber === orderNumber);
  };
  
  const findOrders = (orderNumbers: string[]): Order[] => {
    return orders.filter((order: Order) => orderNumbers.includes(order.orderNumber));
  }

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
                        debts={debts}
                        debtPayments={debtPayments}
                        onAddExpense={handleAddExpense}
                        onPayDebt={handlePayDebt}
                        currentUser={initialUser}
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
