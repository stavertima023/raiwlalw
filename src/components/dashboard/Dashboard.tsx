
'use client';

import * as React from 'react';
import { Order, OrderStatus, User } from '@/lib/types';
import { OrderTable } from './OrderTable';
import { PayoutDialog } from './PayoutDialog';
import { CancelOrderDialog } from './CancelOrderDialog';
import { AddOrderDialog } from './AddOrderDialog';
import { Button } from '@/components/ui/button';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface DashboardProps {
  user: Omit<User, 'password_hash'>;
  orders: Order[];
  isLoading?: boolean;
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate' | 'seller'>) => void;
  onCancelOrder: (orderNumber: string) => void;
  onReturnOrder: (orderNumber: string) => void;
  onPayout: (orderNumbers: string[]) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  findOrder: (orderNumber: string) => Order | undefined;
  findOrders: (orderNumbers: string[]) => Order[];
}

export function Dashboard({
  user,
  orders,
  isLoading = false,
  onAddOrder,
  onCancelOrder,
  onReturnOrder,
  onPayout,
  onUpdateStatus,
  findOrder,
  findOrders,
}: DashboardProps) {
  const [selectedOrders, setSelectedOrders] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  // Filter orders based on search term
  const filteredOrders = React.useMemo(() => {
    if (!searchTerm.trim()) return orders;
    return orders.filter(order => 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold">Панель продавца</h1>
        <p className="text-muted-foreground">
          Управление заказами и отслеживание статусов
        </p>
      </div>

      {/* Индикатор загрузки */}
      <LoadingIndicator 
        isLoading={isLoading}
        dataCount={orders.length}
        dataType="заказов"
        showCacheStatus={true}
      />

      {/* Мобильная версия - вертикальный список */}
      <div className="md:hidden">
        <div className="space-y-4">
          <AddOrderDialog onAddOrder={onAddOrder} buttonClassName="w-full" />
          <CancelOrderDialog 
            onConfirmCancel={onCancelOrder}
            findOrder={findOrder}
          >
            <Button variant="destructive" className="w-full">
              Отмена заказа
            </Button>
          </CancelOrderDialog>
          <PayoutDialog 
            findOrders={findOrders}
            onConfirmPayout={onPayout}
            currentUser={user}
          >
            <Button variant="default" className="w-full">
              Создать выплату
            </Button>
          </PayoutDialog>
        </div>
      </div>

      {/* Десктопная версия - сетка */}
      <div className="hidden md:block">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="space-y-2">
              <AddOrderDialog onAddOrder={onAddOrder} buttonClassName="w-full" />
              <CancelOrderDialog 
                onConfirmCancel={onCancelOrder}
                findOrder={findOrder}
              >
                <Button variant="destructive" className="w-full">
                  Отмена заказа
                </Button>
              </CancelOrderDialog>
              <PayoutDialog 
                findOrders={findOrders}
                onConfirmPayout={onPayout}
                currentUser={user}
              >
                <Button variant="default" className="w-full">
                  Создать выплату
                </Button>
              </PayoutDialog>
            </div>
          </div>
        </div>
      </div>

      <OrderTable 
        orders={filteredOrders}
        currentUser={user}
        onUpdateStatus={onUpdateStatus}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        showSearch={true}
        isLoading={isLoading}
      />
    </div>
  );
}
