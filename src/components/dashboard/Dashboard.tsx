
'use client';

import * as React from 'react';
import { Order, User } from '@/lib/types-pure';
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
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
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
            <p className="text-sm md:text-base text-muted-foreground">
                Добро пожаловать, {user.name}! Здесь все ваши заказы.
            </p>
        </div>

        {/* Инструменты для продавца - оптимизированы для мобильных */}
        <div className="w-full">
            <h3 className="font-semibold mb-3">Инструменты</h3>
            
            {/* Мобильная версия - горизонтальный скролл */}
            <div className="md:hidden">
                <div className="flex gap-3 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-hide">
                    <div className="flex-shrink-0 snap-start">
                        <AddOrderDialog onAddOrder={onAddOrder} buttonSize="sm" />
                    </div>
                    <div className="flex-shrink-0 snap-start">
                        <CancelOrderDialog 
                            onConfirmCancel={onCancelOrder}
                            findOrder={findOrder}
                        >
                            <Button variant="destructive" size="sm" className="whitespace-nowrap">
                                Отмена заказа
                            </Button>
                        </CancelOrderDialog>
                    </div>
                    <div className="flex-shrink-0 snap-start">
                        <PayoutDialog 
                            onConfirmPayout={onPayout}
                            findOrders={findOrders}
                            currentUser={user}
                        >
                            <Button variant="default" size="sm" className="whitespace-nowrap">
                                Выплата
                            </Button>
                        </PayoutDialog>
                    </div>
                    <div className="flex-shrink-0 snap-start">
                        <ReturnOrderDialog 
                            onConfirmReturn={onReturnOrder}
                            findOrder={findOrder}
                        >
                            <Button variant="outline" size="sm" className="whitespace-nowrap">
                                Возврат заказа
                            </Button>
                        </ReturnOrderDialog>
                    </div>
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
                                onConfirmPayout={onPayout}
                                findOrders={findOrders}
                                currentUser={user}
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
            </div>
        </div>
      
       {/* Результаты поиска */}
       {searchTerm.trim() && (
         <div className="text-sm text-muted-foreground">
           {filteredOrders.length > 0 
             ? `Найдено заказов: ${filteredOrders.length} из ${orders.length}`
             : 'Заказы не найдены'
           }
         </div>
       )}

       <OrderTable
          orders={filteredOrders}
          currentUser={user}
          selectedOrders={selectedOrders}
          setSelectedOrders={setSelectedOrders}
          onCancelOrder={onCancelOrder}
          onReturnOrder={onReturnOrder}
          onPayout={onPayout}
          findOrder={findOrder}
          findOrders={findOrders}
          onUpdateStatus={onUpdateStatus}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          showSearch={true}
        />
    </div>
  );
}
