'use client';

import * as React from 'react';
import useSWR, { mutate } from 'swr';
import { Order, OrderStatus, User, Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { PrinterDashboard } from '@/components/printer/PrinterDashboard';
import { AdminOrderList } from '@/components/admin/AdminOrderList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpensesList } from '@/components/admin/ExpensesList';
import AIAnalytics from '@/components/admin/AIAnalytics';

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
  initialUser: Omit<User, 'password_hash'>
}

export default function DashboardRoot({ initialUser }: DashboardRootProps) {
  const { toast } = useToast();
  
  const { data: orders = [], error: ordersError } = useSWR<Order[]>('/api/orders', fetcher);
  
  const { data: expenses = [], error: expensesError } = useSWR<Expense[]>(
    initialUser.role === 'Администратор' ? '/api/expenses' : null, 
    fetcher
  );

  React.useEffect(() => {
    if (ordersError) {
      toast({ title: 'Ошибка загрузки заказов', description: ordersError.message, variant: 'destructive' });
    }
    if (expensesError) {
      toast({ title: 'Ошибка загрузки расходов', description: expensesError.message, variant: 'destructive' });
    }
  }, [ordersError, expensesError, toast]);

  const handleAddOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate' | 'seller'>) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrderData),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Server error');
      }
      mutate('/api/orders');
      toast({ title: 'Заказ успешно добавлен' });
    } catch (error: any) {
      toast({ title: 'Ошибка добавления заказа', description: error.message, variant: 'destructive' });
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
  
  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'date' | 'responsible'>) => {
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
      mutate('/api/expenses');
      toast({ title: 'Расход успешно добавлен' });
    } catch (error: any) {
      toast({ title: 'Ошибка добавления расхода', description: error.message, variant: 'destructive' });
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
      const payoutPromises = findOrders(orderNumbers)
        .filter(order => order.id)
        .map(order => handleUpdateOrderStatus(order.id!, 'Исполнен'));
      try {
        await Promise.all(payoutPromises);
        toast({ title: 'Оплата проведена', description: `${orderNumbers.length} заказ(а/ов) были отмечены как "Исполнен".` });
      } catch (error: any) {
        toast({ title: 'Ошибка проведения оплаты', description: error.message, variant: 'destructive' });
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
              return <AdminOrderList allOrders={orders} allUsers={[]} />;
            case 'admin-expenses':
              return <ExpensesList 
                        allExpenses={expenses} 
                        allUsers={[]} 
                        onAddExpense={handleAddExpense}
                        currentUser={initialUser}
                      />;
            case 'admin-analytics':
              return <PlaceholderComponent title="Аналитика" description="Интерактивные дашборды и графики." />;
            case 'admin-ai-analytics':
               return <AIAnalytics orders={orders} expenses={expenses} />;
            default:
              return <AdminOrderList allOrders={orders} allUsers={[]} />;
          }
        }
        return null;
      }}
    </AppLayout>
  );
}
