
'use client';

import * as React from 'react';
import { User, Order, OrderStatus, ProductType } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  PlusCircle,
  XCircle,
  DollarSign,
  List,
  Send,
  Package,
  Undo2,
} from 'lucide-react';
import { OrderForm } from './OrderForm';
import { CancelOrderDialog } from './CancelOrderDialog';
import { PayoutDialog } from './PayoutDialog';
import { ReturnOrderDialog } from './ReturnOrderDialog';
import { OrderTable } from './OrderTable';
import Filters from './Filters';

interface DashboardProps {
  user: User;
  orders: Order[];
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
  onCancelOrder: (orderNumber: string) => void;
  onReturnOrder: (orderNumber: string) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  findOrder: (orderNumber: string) => Order | undefined;
  findOrders: (orderNumbers: string[]) => Order[];
  onPayout: (orderNumbers: string[]) => void;
}


export function Dashboard({ user, orders, onAddOrder, onCancelOrder, onReturnOrder, findOrder, findOrders, onPayout, onUpdateStatus }: DashboardProps) {
  const [filters, setFilters] = React.useState({
    status: 'all' as OrderStatus | 'all',
    productType: 'all' as ProductType | 'all',
    orderNumber: '',
  });

  const filteredOrders = React.useMemo(() => {
    return orders.filter(order => {
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
      const orderNumberMatch = filters.orderNumber === '' || order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
      return statusMatch && productTypeMatch && orderNumberMatch;
    });
  }, [orders, filters]);


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Инструменты</CardTitle>
          <CardDescription>Быстрые действия для управления заказами.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <OrderForm onSave={onAddOrder} currentUser={user}>
                <Button
                  variant="outline"
                  className="w-full h-32 flex flex-col items-center justify-center gap-2"
                >
                  <PlusCircle className="h-8 w-8" />
                  <span>Добавить заказ</span>
                </Button>
              </OrderForm>

              <CancelOrderDialog findOrder={findOrder} onConfirmCancel={onCancelOrder}>
                  <Button
                    variant="outline"
                    className="w-full h-32 flex flex-col items-center justify-center gap-2"
                  >
                    <XCircle className="h-8 w-8" />
                    <span>Отменить заказ</span>
                  </Button>
              </CancelOrderDialog>
              
              <PayoutDialog findOrders={findOrders} onConfirmPayout={onPayout} >
                 <Button
                    variant="outline"
                    className="w-full h-32 flex flex-col items-center justify-center gap-2"
                  >
                    <DollarSign className="h-8 w-8" />
                    <span>Вывод оплаты</span>
                  </Button>
              </PayoutDialog>
              
              <ReturnOrderDialog findOrder={findOrder} onConfirmReturn={onReturnOrder}>
                <Button
                  variant="outline"
                  className="w-full h-32 flex flex-col items-center justify-center gap-2"
                >
                  <Undo2 className="h-8 w-8" />
                  <span>Возврат заказа</span>
                </Button>
              </ReturnOrderDialog>
          </div>
        </CardContent>
      </Card>
      
      <Filters onFilterChange={setFilters} currentFilters={filters} />

      <OrderTable 
        orders={filteredOrders} 
        currentUser={user} 
        onUpdateStatus={onUpdateStatus}
      />
    </div>
  );
}
