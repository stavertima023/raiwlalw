
'use client';

import * as React from 'react';
import type { Order, User } from '@/lib/types';
import { OrderTable } from './OrderTable';
import { Filters } from './Filters';
import { PayoutDialog } from './PayoutDialog';
import { ReturnOrderDialog } from './ReturnOrderDialog';
import { CancelOrderDialog } from './CancelOrderDialog';

type SafeUser = Omit<User, 'password_hash'>;

interface DashboardProps {
  user: SafeUser;
  orders: Order[];
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate' | 'seller'>) => void;
  onCancelOrder: (orderNumber: string) => void;
  onReturnOrder: (orderNumber: string) => void;
  findOrder: (orderNumber: string) => Order | undefined;
  findOrders: (orderNumbers: string[]) => Order[];
  onPayout: (orderNumbers: string[]) => void;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  user,
  orders,
  onAddOrder,
  onCancelOrder,
  onReturnOrder,
  findOrder,
  findOrders,
  onPayout,
  onUpdateStatus,
}) => {
  return (
    <div className="space-y-6">
       <OrderTable
          orders={orders}
          currentUser={user}
          onCancelOrder={onCancelOrder}
          onReturnOrder={onReturnOrder}
          findOrder={findOrder}
          findOrders={findOrders}
          onPayout={onPayout}
          onUpdateStatus={onUpdateStatus}
        />
    </div>
  );
};
