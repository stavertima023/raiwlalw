'use client';

import * as React from 'react';
import { Order, OrderStatus, User, Expense } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { PrinterDashboard } from '@/components/printer/PrinterDashboard';
import { AdminOrderList } from '@/components/admin/AdminOrderList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpensesList } from '@/components/admin/ExpensesList';
import AIAnalytics from '@/components/admin/AIAnalytics';
import { supabase } from '@/lib/supabaseClient';

// Renamed from 'Home'
export default function DashboardRoot({ initialUser }: { initialUser: Omit<User, 'password_hash'> }) {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  // User is now managed by the session, passed as a prop
  const [currentUser, setCurrentUser] = React.useState(initialUser);
  const { toast } = useToast();

  const fetchOrders = React.useCallback(async () => {
    let query = supabase.from('orders').select('*').order('orderDate', { ascending: false });

    // If the user is a seller, only fetch their orders
    if (currentUser.role === 'Продавец') {
      query = query.eq('seller', currentUser.username);
    }
    
    const { data, error } = await query;

    if (error) {
      toast({ title: 'Ошибка загрузки заказов', description: error.message, variant: 'destructive' });
      console.error('Error fetching orders:', error);
    } else if (data) {
      const parsedData = data.map(item => ({...item, orderDate: new Date(item.orderDate) }))
      setOrders(parsedData as any);
    }
  }, [toast, currentUser]);

  const fetchExpenses = React.useCallback(async () => {
    const { data, error } = await supabase.from('expenses').select('*').order('date', { ascending: false });
     if (error) {
      toast({ title: 'Ошибка загрузки расходов', description: error.message, variant: 'destructive' });
      console.error('Error fetching expenses:', error);
    } else if (data) {
       const parsedData = data.map(item => ({...item, date: new Date(item.date) }))
      setExpenses(parsedData as any);
    }
  }, [toast]);

  React.useEffect(() => {
    fetchOrders();
    // Only admins see expenses
    if (currentUser.role === 'Администратор') {
      fetchExpenses();
    }
  }, [fetchOrders, fetchExpenses, currentUser.role]);


  const handleAddOrder = async (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    const newOrder = {
      ...newOrderData,
      seller: currentUser.username, // Automatically set the seller
      orderDate: new Date(),
    };
    const { error } = await supabase.from('orders').insert(newOrder);
    if (error) {
      toast({ title: 'Ошибка добавления заказа', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Заказ успешно добавлен' });
      fetchOrders();
    }
  };

  // ... (keep other handlers: handleCancelOrder, handleReturnOrder, etc. as they are)
  // ... they already re-fetch data, which respects the role-based filtering
  const handleCancelOrder = async (orderNumber: string) => {
    const { error } = await supabase.from('orders').update({ status: 'Отменен' }).eq('orderNumber', orderNumber);
    if (error) {
       toast({ title: 'Ошибка отмены заказа', description: error.message, variant: 'destructive' });
    } else {
       toast({ title: 'Заказ отменен', description: `Статус заказа #${orderNumber} изменен на "Отменен".` });
       fetchOrders();
    }
  };
  
  const handleReturnOrder = async (orderNumber: string) => {
    const { error } = await supabase.from('orders').update({ status: 'Возврат' }).eq('orderNumber', orderNumber);
     if (error) {
       toast({ title: 'Ошибка возврата заказа', description: error.message, variant: 'destructive' });
    } else {
       toast({ title: 'Оформлен возврат', description: `Статус заказа #${orderNumber} изменен на "Возврат".` });
       fetchOrders();
    }
  };

  const handlePayout = async (orderNumbers: string[]) => {
    const { error } = await supabase.from('orders').update({ status: 'Исполнен' }).in('orderNumber', orderNumbers);
    if (error) {
       toast({ title: 'Ошибка проведения оплаты', description: error.message, variant: 'destructive' });
    } else {
       toast({ title: 'Оплата проведена', description: `${orderNumbers.length} заказ(а/ов) были отмечены как "Исполнен".` });
       fetchOrders();
    }
  };
  
  const handleUpdateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
     if (error) {
       toast({ title: 'Ошибка обновления статуса', description: error.message, variant: 'destructive' });
    } else {
       toast({ title: 'Статус заказа обновлен', description: `Заказ получил новый статус: "${newStatus}".` });
       fetchOrders();
    }
  };
  
  const handleAddExpense = async (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense = {
      ...newExpenseData,
      date: new Date(),
    };
    const { error } = await supabase.from('expenses').insert(newExpense);
    if (error) {
      toast({ title: 'Ошибка добавления расхода', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Расход успешно добавлен' });
      fetchExpenses();
    }
  }

  const findOrder = (orderNumber: string): Order | undefined => {
    return orders.find((order: Order) => order.orderNumber === orderNumber);
  };
  
  const findOrders = (orderNumbers: string[]): Order[] => {
    return orders.filter((order: Order) => orderNumbers.includes(order.orderNumber));
  }

  // This is no longer needed as filtering is done in the fetch query
  // const filteredOrdersForSeller = React.useMemo(() => {
  //   return orders
  //     .filter((order: Order) => order.seller === currentUser.username)
  // }, [orders, currentUser]);

  const allPrinterOrders = React.useMemo(() => {
    return orders
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
    <AppLayout 
      currentUser={currentUser} 
      onAddOrder={handleAddOrder}
      onUpdateStatus={handleUpdateOrderStatus}
      orders={orders}
    >
      {(activeView: string) => {
        if (currentUser.role === 'Продавец') {
           return <Dashboard 
            user={currentUser} 
            orders={orders} // Pass all fetched orders (already filtered)
            onAddOrder={handleAddOrder} 
            onCancelOrder={handleCancelOrder}
            onReturnOrder={handleReturnOrder}
            findOrder={findOrder}
            findOrders={findOrders}
            onPayout={handlePayout}
            onUpdateStatus={handleUpdateOrderStatus}
          />
        }
        if (currentUser.role === 'Принтовщик') {
          return (
             <PrinterDashboard
                currentUser={currentUser}
                onUpdateStatus={handleUpdateOrderStatus}
                allOrders={allPrinterOrders}
              />
          )
        }
        if (currentUser.role === 'Администратор') {
          switch (activeView) {
            case 'admin-orders':
              return <AdminOrderList allOrders={orders} allUsers={[]} />;
            case 'admin-expenses':
              return <ExpensesList 
                        allExpenses={expenses} 
                        allUsers={[]} 
                        onAddExpense={handleAddExpense}
                        currentUser={currentUser} 
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
