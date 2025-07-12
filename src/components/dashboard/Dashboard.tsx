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

interface DashboardProps {
  user: User;
  onNavigate: (view: 'orders') => void;
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
}

const sellerActions = [
  { label: 'Мои заказы', icon: List, action: 'view_orders' },
  { label: 'Отменить заказ', icon: XCircle, action: 'cancel_order' },
  { label: 'Вывод оплаты', icon: DollarSign, action: 'payout' },
];

const printerActions = [
  { label: 'Список заказов', icon: List, action: 'view_orders' },
  { label: 'Отправка заказов', icon: Send, action: 'send_orders' },
  { label: 'Все заказы', icon: Package, action: 'view_all_orders' },
];

export function Dashboard({ user, onNavigate, onAddOrder }: DashboardProps) {
  const actions = user.role === 'Продавец' ? sellerActions : printerActions;

  const handleAction = (action: string) => {
    // For now, most buttons will navigate to the order list.
    // This can be expanded later.
    switch (action) {
      case 'view_orders':
      case 'view_all_orders':
        onNavigate('orders');
        break;
      // Add other cases for cancel_order, payout, send_orders etc.
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
            <OrderForm onSave={onAddOrder} currentUserRole={user.role}>
              <Button
                variant="outline"
                className="w-full h-24 flex flex-col items-center justify-center gap-2"
              >
                <PlusCircle className="h-8 w-8" />
                <span>Добавить заказ</span>
              </Button>
            </OrderForm>
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
