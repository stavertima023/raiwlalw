'use client';

import * as React from 'react';
import { Order, OrderStatus, User, Expense, ExpenseCategory } from '@/lib/types';
import { mockOrders, mockUsers, mockExpenses } from '@/lib/data';
import { v4 as uuidv4 } from 'uuid';
import { useToast } from '@/hooks/use-toast';
import { AppLayout } from '@/components/layout/AppLayout';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

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
    toast({
      title: 'Заказ создан',
      description: `Заказ #${newOrder.orderNumber} был успешно добавлен.`,
    });
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
  
  const handleAddExpense = (newExpenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...newExpenseData,
      id: uuidv4(),
    };
    setExpenses((prev) => [newExpense, ...prev]);
    toast({
      title: 'Расход добавлен',
      description: 'Новая запись о расходах успешно создана.'
    })
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

  const filteredOrdersForPrinter = React.useMemo(() => {
    return orders
      .filter(order => order.status === 'Добавлен' || order.status === 'Готов')
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
    <AppLayout currentUser={currentUser} onUserChange={setCurrentUser}>
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
             <div className="space-y-6">
              <OrderTable 
                orders={filteredOrdersForPrinter} 
                currentUser={currentUser} 
                onUpdateStatus={handleUpdateOrderStatus}
                useLargeLayout={true}
              />
            </div>
          )
        }
        if (currentUser.role === 'Администратор') {
          switch (activeView) {
            case 'admin-orders':
              return <PlaceholderComponent title="Список заказов" description="Просмотр и управление всеми заказами в системе." />;
            case 'admin-expenses':
              return <PlaceholderComponent title="Расходы" description="Отслеживание и управление расходами." />;
            case 'admin-analytics':
              return <PlaceholderComponent title="Аналитика" description="Интерактивные дашборды и графики." />;
            case 'admin-ai-analytics':
               return <PlaceholderComponent title="AI-аналитика" description="Интеллектуальный анализ данных и прогнозы." />;
            default:
              return <PlaceholderComponent title="Панель администратора" description="Выберите раздел для начала работы." />;
          }
        }
        return null;
      }}
    </AppLayout>
  );
}
