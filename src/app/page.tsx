
'use client';

import * as React from 'react';
import { Order, OrderStatus, User, Expense, ExpenseCategory } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { PrinterDashboard } from '@/components/printer/PrinterDashboard';
import { AdminOrderList } from '@/components/admin/AdminOrderList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ExpensesList } from '@/components/admin/ExpensesList';
import AIAnalytics from '@/components/admin/AIAnalytics';

export default function Home() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [expenses, setExpenses] = React.useState<Expense[]>([]);
  const [currentUser, setCurrentUser] = React.useState<User>({ 
    id: '1', 
    telegramId: 'admin', 
    name: 'Admin', 
    role: 'Администратор', 
    payouts: [] 
  }); 
  const { toast } = useToast();

  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    const newOrder: Order = {
      ...newOrderData,
      id: uuidv4(),
      orderDate: new Date(),
    };
    setOrders((prevOrders: Order[]) => [newOrder, ...prevOrders]);
  };

  const handleCancelOrder = (orderNumber: string) => {
    setOrders((prevOrders: Order[]) =>
      prevOrders.map((order: Order) =>
        order.orderNumber === orderNumber ? { ...order, status: 'Отменен' } : order
      )
    );
     toast({
      title: 'Заказ отменен',
      description: `Статус заказа #${orderNumber} изменен на "Отменен".`,
    });
  };
  
  const handleReturnOrder = (orderNumber: string) => {
    setOrders((prevOrders: Order[]) =>
      prevOrders.map((order: Order) =>
        order.orderNumber === orderNumber ? { ...order, status: 'Возврат' } : order
      )
    );
     toast({
      title: 'Оформлен возврат',
      description: `Статус заказа #${orderNumber} изменен на "Возврат".`,
    });
  };

  const handlePayout = (orderNumbers: string[]) => {
    setOrders((prevOrders: Order[]) =>
      prevOrders.map((order: Order) =>
        orderNumbers.includes(order.orderNumber)
          ? { ...order, status: 'Исполнен' }
          : order
      )
    );
    toast({
      title: 'Оплата проведена',
      description: `${orderNumbers.length} заказ(а/ов) были отмечены как "Исполнен".`,
    });
  };
  
  const handleUpdateOrderStatus = (orderId: string, newStatus: OrderStatus) => {
    setOrders((prevOrders: Order[]) =>
      prevOrders.map((order: Order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
    toast({
      title: 'Статус заказа обновлен',
      description: `Заказ получил новый статус: "${newStatus}".`,
    });
  };
  
  const handleAddExpense = (newExpenseData: Omit<Expense, 'id' | 'date'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: uuidv4(),
      date: new Date(),
    };
    setExpenses((prev: Expense[]) => [newExpense, ...prev]);
  }

  const findOrder = (orderNumber: string): Order | undefined => {
    return orders.find((order: Order) => order.orderNumber === orderNumber);
  };
  
  const findOrders = (orderNumbers: string[]): Order[] => {
    return orders.filter((order: Order) => orderNumbers.includes(order.orderNumber));
  }

  const filteredOrdersForSeller = React.useMemo(() => {
    return orders
      .filter((order: Order) => order.seller === currentUser.telegramId)
      .sort((a: Order, b: Order) => b.orderDate.getTime() - a.orderDate.getTime());
  }, [orders, currentUser]);

  const allPrinterOrders = React.useMemo(() => {
    return orders
      .sort((a: Order, b: Order) => b.orderDate.getTime() - a.orderDate.getTime());
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
            orders={filteredOrdersForSeller}
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
