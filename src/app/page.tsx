'use client';

import * as React from 'react';
import { Order, OrderStatus, ProductType, User, Role } from '@/lib/types';
import { mockOrders, mockUsers } from '@/lib/data';
import Header from '@/components/dashboard/Header';
import Filters from '@/components/dashboard/Filters';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

export default function Home() {
  const [orders, setOrders] = React.useState<Order[]>(mockOrders);
  const [currentUser, setCurrentUser] = React.useState<User>(mockUsers[0]);
  const [view, setView] = React.useState<'dashboard' | 'orders'>('dashboard');
  const { toast } = useToast();

  const [filters, setFilters] = React.useState<{
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
    orderNumber: string;
  }>({
    status: 'all',
    productType: 'all',
    orderNumber: '',
  });

  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    const newOrder: Order = {
      ...newOrderData,
      id: uuidv4(),
      orderDate: new Date(),
    };
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    setView('orders');
    setFilters({ status: 'all', productType: 'all', orderNumber: '' });
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

  const findOrder = (orderNumber: string): Order | undefined => {
    return orders.find((order) => order.orderNumber === orderNumber);
  };
  
  const findOrders = (orderNumbers: string[]): Order[] => {
    return orders.filter(order => orderNumbers.includes(order.orderNumber));
  }

  const filteredOrders = React.useMemo(() => {
    return orders
      .filter((order) => {
        const statusMatch = filters.status === 'all' || order.status === filters.status;
        const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
        const sellerMatch = currentUser.role === 'Продавец' ? order.seller === currentUser.telegramId : true;
        const orderNumberMatch = filters.orderNumber === '' || order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
        return statusMatch && productTypeMatch && sellerMatch && orderNumberMatch;
      })
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }, [orders, filters, currentUser]);

  const toggleUserRole = () => {
    setCurrentUser(currentUser.role === 'Продавец' ? mockUsers[1] : mockUsers[0]);
    setView('dashboard');
    setFilters({ status: 'all', productType: 'all', orderNumber: '' });
  };
  
  const getOrderViewTitle = () => {
     if (currentUser.role === 'Продавец') return 'Мои заказы';
     if (filters.status === 'Добавлен') return 'Новые заказы';
     if (filters.status === 'Готов') return 'Готовые к отправке';
     return 'Все заказы';
  }

  const navigateToOrders = (statusFilter: OrderStatus | 'all' = 'all') => {
    setFilters(prev => ({ ...prev, status: statusFilter, orderNumber: '' }));
    setView('orders');
  };

  const useLargePhotos = currentUser.role === 'Принтовщик' && (filters.status === 'Добавлен' || filters.status === 'Готов');

  return (
    <div className="flex flex-col min-h-screen">
      <Header onAddOrder={handleAddOrder} onBackToDashboard={() => {
        setView('dashboard');
        setFilters({ status: 'all', productType: 'all', orderNumber: '' });
      }} showBackButton={view === 'orders'} currentUser={currentUser} />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-end mb-4 space-x-2">
            <Label htmlFor="role-switch">
              Текущая роль: <span className="font-bold">{currentUser.role}</span>
            </Label>
             <Switch
              id="role-switch"
              checked={currentUser.role === 'Принтовщик'}
              onCheckedChange={toggleUserRole}
            />
        </div>

        {view === 'dashboard' ? (
          <Dashboard 
            user={currentUser} 
            onNavigate={navigateToOrders} 
            onAddOrder={handleAddOrder} 
            onCancelOrder={handleCancelOrder}
            onReturnOrder={handleReturnOrder}
            findOrder={findOrder}
            findOrders={findOrders}
            onPayout={handlePayout}
          />
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{getOrderViewTitle()}</h2>
            <Filters onFilterChange={setFilters} currentFilters={filters} />
            <OrderTable 
              orders={filteredOrders} 
              currentUser={currentUser} 
              onUpdateStatus={handleUpdateOrderStatus}
              largePhotos={useLargePhotos}
            />
          </div>
        )}
      </main>
    </div>
  );
}
