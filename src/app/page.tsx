
'use client';

import * as React from 'react';
import { Order, OrderStatus, User, Expense, ExpenseCategory } from '@/lib/types';
import { mockOrders, mockUsers, mockExpenses } from '@/lib/data';
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
  const [orders, setOrders] = React.useState<Order[]>(mockOrders);
  const [expenses, setExpenses] = React.useState<Expense[]>(mockExpenses);
  const [currentUser, setCurrentUser] = React.useState<User>(mockUsers[0]); 
  const { toast } = useToast();

  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    const newOrder: Order = {
      ...newOrderData,
      id: uuidv4(),
      orderDate: new Date(),
    };
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
  };

  const handleCancelOrder = (orderNumber: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.orderNumber === orderNumber ? { ...order, status: 'Отменен' } : order
      )
    );
     toast({
      title: 'Заказ отменен',
      description: `Статус заказа #${orderNumber} изменен на "Отменен".`,
    });
  };
  
  const handleReturnOrder = (orderNumber: string) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
        order.orderNumber === orderNumber ? { ...order, status: 'Возврат' } : order
      )
    );
     toast({
      title: 'Оформлен возврат',
      description: `Статус заказа #${orderNumber} изменен на "Возврат".`,
    });
  };

  const handlePayout = (orderNumbers: string[]) => {
    setOrders((prevOrders) =>
      prevOrders.map((order) =>
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
    setOrders(prevOrders =>
      prevOrders.map(order =>
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
    setExpenses((prev) => [newExpense, ...prev]);
  }

  const findOrder = (orderNumber: string): Order | undefined => {
    return orders.find((order) => order.orderNumber === orderNumber);
  };
  
  const findOrders = (orderNumbers: string[]): Order[] => {
    return orders.filter(order => orderNumbers.includes(order.orderNumber));
  }

  const filteredOrdersForSeller = React.useMemo(() => {
    return orders
      .filter((order) => order.seller === currentUser.telegramId)
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }, [orders, currentUser]);

  const ordersForProduction = React.useMemo(() => {
    return orders
      .filter(order => order.status === 'Добавлен')
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }, [orders]);
  
  const ordersForShipment = React.useMemo(() => {
    return orders
      .filter(order => order.status === 'Готов')
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }, [orders]);

  const allPrinterOrders = React.useMemo(() => {
    return orders
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
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
      onUserChange={setCurrentUser}
      onAddOrder={handleAddOrder}
      onUpdateStatus={handleUpdateOrderStatus}
      orders={orders}
    >
      {(activeView) => {
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
                ordersForProduction={ordersForProduction}
                ordersForShipment={ordersForShipment}
                allOrders={allPrinterOrders}
              />
          )
        }
        if (currentUser.role === 'Администратор') {
          switch (activeView) {
            case 'admin-orders':
              return <AdminOrderList allOrders={orders} allUsers={mockUsers} />;
            case 'admin-expenses':
              return <ExpensesList 
                        allExpenses={expenses} 
                        allUsers={mockUsers} 
                        onAddExpense={handleAddExpense} 
                      />;
            case 'admin-analytics':
              return <PlaceholderComponent title="Аналитика" description="Интерактивные дашборды и графики." />;
            case 'admin-ai-analytics':
               return <AIAnalytics orders={orders} expenses={expenses} />;
            default:
              return <AdminOrderList allOrders={orders} allUsers={mockUsers} />;
          }
        }
        return null;
      }}
    </AppLayout>
  );
}
