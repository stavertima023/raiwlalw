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

export default function Home() {
  const [orders, setOrders] = React.useState<Order[]>(mockOrders);
  const [currentUser, setCurrentUser] = React.useState<User>(mockUsers[0]);
  const [view, setView] = React.useState<'dashboard' | 'orders'>('dashboard');

  const [filters, setFilters] = React.useState<{
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
  }>({
    status: 'all',
    productType: 'all',
  });

  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    const newOrder: Order = {
      ...newOrderData,
      id: uuidv4(),
      orderDate: new Date(),
    };
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
    setView('orders');
  };

  const filteredOrders = React.useMemo(() => {
    return orders
      .filter((order) => {
        const statusMatch = filters.status === 'all' || order.status === filters.status;
        const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
        const sellerMatch = currentUser.role === 'Продавец' ? order.seller === currentUser.telegramId : true;
        return statusMatch && productTypeMatch && sellerMatch;
      })
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }, [orders, filters, currentUser]);

  const toggleUserRole = () => {
    setCurrentUser(currentUser.role === 'Продавец' ? mockUsers[1] : mockUsers[0]);
    setView('dashboard');
  };
  
  const getOrderViewTitle = () => {
     if (currentUser.role === 'Продавец') return 'Мои заказы';
     return 'Все заказы';
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header onAddOrder={handleAddOrder} onBackToDashboard={() => setView('dashboard')} showBackButton={view === 'orders'} currentUser={currentUser} />
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
          <Dashboard user={currentUser} onNavigate={() => setView('orders')} onAddOrder={handleAddOrder} />
        ) : (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">{getOrderViewTitle()}</h2>
            <Filters onFilterChange={setFilters} />
            <OrderTable orders={filteredOrders} />
          </div>
        )}
      </main>
    </div>
  );
}
