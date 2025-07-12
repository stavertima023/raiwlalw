'use client';

import * as React from 'react';
import { User, Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PlusCircle,
  XCircle,
  DollarSign,
  List,
  Send,
  Package,
} from 'lucide-react';
import { OrderForm } from './OrderForm';
import { CancelOrderDialog } from './CancelOrderDialog';
import { PayoutDialog } from './PayoutDialog';

interface DashboardProps {
  user: User;
  onNavigate: (view: 'orders') => void;
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
  onCancelOrder: (orderNumber: string) => void;
  findOrder: (orderNumber: string) => Order | undefined;
  findOrders: (orderNumbers: string[]) => Order[];
  onPayout: (orderNumbers: string[]) => void;
}

const sellerActions = [
  { label: 'Мои заказы', icon: List, action: 'view_orders' },
];

const printerActions = [
  { label: 'Список заказов', icon: List, action: 'view_orders' },
  { label: 'Отправка заказов', icon: Send, action: 'send_orders' },
  { label: 'Все заказы', icon: Package, action: 'view_all_orders' },
];

export function Dashboard({ user, onNavigate, onAddOrder, onCancelOrder, findOrder, findOrders, onPayout }: DashboardProps) {
  const actions = user.role === 'Продавец' ? sellerActions : printerActions;

  const handleAction = (action: string) => {
    switch (action) {
      case 'view_orders':
      case 'view_all_orders':
        onNavigate('orders');
        break;
      default:
        console.log(`Action: ${action}`);
        break;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Добро пожаловать, {user.name}!</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {user.role === 'Продавец' && (
            <>
              <OrderForm onSave={onAddOrder} currentUser={user}>
                <Button
                  variant="outline"
                  className="w-full h-24 flex flex-col items-center justify-center gap-2"
                >
                  <PlusCircle className="h-8 w-8" />
                  <span>Добавить заказ</span>
                </Button>
              </OrderForm>

              <CancelOrderDialog findOrder={findOrder} onConfirmCancel={onCancelOrder}>
                  <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <XCircle className="h-8 w-8" />
                    <span>Отменить заказ</span>
                  </Button>
              </CancelOrderDialog>
              
              <PayoutDialog findOrders={findOrders} onConfirmPayout={onPayout} >
                 <Button
                    variant="outline"
                    className="w-full h-24 flex flex-col items-center justify-center gap-2"
                  >
                    <DollarSign className="h-8 w-8" />
                    <span>Вывод оплаты</span>
                  </Button>
              </PayoutDialog>
            </>
          )}

          {actions.map(({ label, icon: Icon, action }) => (
            <Button
              key={label}
              variant="outline"
              className="w-full h-24 flex flex-col items-center justify-center gap-2"
              onClick={() => handleAction(action)}
            >
              <Icon className="h-8 w-8" />
              <span>{label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
