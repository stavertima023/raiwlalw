
'use client';

import * as React from 'react';
import { Order, OrderStatus, User } from '@/lib/types';
import { OrderTable } from './OrderTable';
import { PayoutDialog } from './PayoutDialog';
import { ReturnOrderDialog } from './ReturnOrderDialog';
import { CancelOrderDialog } from './CancelOrderDialog';
import { AddOrderDialog } from './AddOrderDialog';
import { Button } from '@/components/ui/button';

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
       <div>
            <h1 className="text-2xl font-bold">Панель продавца</h1>
            <p className="text-muted-foreground">
                Добро пожаловать, {user.name}! Здесь все ваши заказы.
            </p>
        </div>

        {/* Инструменты для продавца */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
                <h3 className="font-semibold mb-3">Инструменты</h3>
                <div className="space-y-2">
                    <AddOrderDialog onAddOrder={onAddOrder} />
                    <CancelOrderDialog 
                        onConfirmCancel={onCancelOrder}
                        findOrder={findOrder}
                    >
                        <Button variant="destructive" className="w-full">
                            Отмена заказа
                        </Button>
                    </CancelOrderDialog>
                    <PayoutDialog 
                        onConfirmPayout={onPayout}
                        findOrders={findOrders}
                    >
                        <Button variant="default" className="w-full">
                            Выплата
                        </Button>
                    </PayoutDialog>
                    <ReturnOrderDialog 
                        onConfirmReturn={onReturnOrder}
                        findOrder={findOrder}
                    >
                        <Button variant="outline" className="w-full">
                            Возврат заказа
                        </Button>
                    </ReturnOrderDialog>
                </div>
            </div>
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
