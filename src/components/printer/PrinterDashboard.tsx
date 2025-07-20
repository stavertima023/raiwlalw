
'use client';

import * as React from 'react';
import type { Order, User, OrderStatus, ProductType } from '@/lib/types';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import Filters from '@/components/dashboard/Filters';

interface PrinterDashboardProps {
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  allOrders: Order[];
}

export function PrinterDashboard({
  currentUser,
  onUpdateStatus,
  allOrders,
}: PrinterDashboardProps) {
  const [filters, setFilters] = React.useState({
    status: 'all' as OrderStatus | 'all',
    productType: 'all' as ProductType | 'all',
    orderNumber: '',
  });

  const filteredOrders = React.useMemo(() => {
    return allOrders.filter(order => {
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
      const orderNumberMatch = filters.orderNumber === '' || order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
      return statusMatch && productTypeMatch && orderNumberMatch;
    });
  }, [allOrders, filters]);

  const ordersForProduction = React.useMemo(() => {
    return filteredOrders
      .filter(order => order.status === 'Добавлен');
  }, [filteredOrders]);
  
  const ordersForShipment = React.useMemo(() => {
    return filteredOrders
      .filter(order => order.status === 'Готов');
  }, [filteredOrders]);


  return (
    <div className="space-y-6">
       <Card>
        <CardHeader>
          <CardTitle>Рабочая область Принтовщика</CardTitle>
          <CardDescription>
            Здесь отображаются заказы, требующие вашего внимания.
          </CardDescription>
        </CardHeader>
      </Card>

      <Filters onFilterChange={setFilters} currentFilters={filters} />
      
       <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 p-1">
          <TabsTrigger value="production" className="text-xs px-2 py-1">
            <span className="hidden sm:inline">На изготовление</span>
            <span className="sm:hidden">Изготовление</span>
            <Badge variant="secondary" className="ml-1 text-xs">{ordersForProduction.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shipment" className="text-xs px-2 py-1">
            <span className="hidden sm:inline">На отправку</span>
            <span className="sm:hidden">Отправка</span>
            <Badge variant="secondary" className="ml-1 text-xs">{ordersForShipment.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs px-2 py-1">
            Все заказы
            <Badge variant="secondary" className="ml-1 text-xs">{filteredOrders.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="production">
            <OrderTable 
                orders={ordersForProduction} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                useLargeLayout={true}
            />
        </TabsContent>
        <TabsContent value="shipment">
             <OrderTable 
                orders={ordersForShipment} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                useLargeLayout={true}
            />
        </TabsContent>
        <TabsContent value="all">
             <OrderTable 
                orders={filteredOrders} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                useLargeLayout={true}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
