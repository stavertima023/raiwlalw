
'use client';

import * as React from 'react';
import { Order, OrderStatus, User } from '@/lib/types';
import { OrderTable } from './OrderTable';
import { PayoutDialog } from './PayoutDialog';
import { ReturnOrderDialog } from './ReturnOrderDialog';
import { CancelOrderDialog } from './CancelOrderDialog';
import { AddOrderDialog } from './AddOrderDialog';

interface DashboardProps {
  user: Omit<User, 'password_hash'>;
  orders: Order[];
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
  onAddOrder,
  onCancelOrder,
  onReturnOrder,
  onPayout,
  onUpdateStatus,
  findOrder,
  findOrders
}: DashboardProps) {
  const [selectedOrders, setSelectedOrders] = React.useState<string[]>([]);

  return (
    <div className="flex flex-col gap-6">
       <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold">Панель продавца</h1>
                <p className="text-muted-foreground">
                    Добро пожаловать, {user.name}! Здесь все ваши заказы.
                </p>
            </div>
            <AddOrderDialog onAddOrder={onAddOrder} />
        </div>
      
       <OrderTable
          orders={orders}
          currentUser={user}
        selectedOrders={selectedOrders}
        setSelectedOrders={setSelectedOrders}
          onCancelOrder={onCancelOrder}
          onReturnOrder={onReturnOrder}
        onPayout={onPayout}
          findOrder={findOrder}
          findOrders={findOrders}
        />
    </div>
  );
}
