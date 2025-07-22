
'use client';

import * as React from 'react';
import type { Order, User, OrderStatus, ProductType } from '@/lib/types';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import Filters from '@/components/dashboard/Filters';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface PrinterDashboardProps {
  currentUser: User;
  productionOrders: Order[];
  allOrders: Order[];
  isLoadingProduction?: boolean;
  isLoadingAll?: boolean;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  printerTab?: 'production'|'shipment'|'all';
  onTabChange?: (tab: 'production'|'shipment'|'all') => void;
  loadOrdersButton?: React.ReactNode;
}

export function PrinterDashboard({
  currentUser,
  productionOrders,
  allOrders,
  isLoadingProduction = false,
  isLoadingAll = false,
  onUpdateStatus,
  printerTab = 'production',
  onTabChange,
  loadOrdersButton,
}: PrinterDashboardProps) {
  const [filters, setFilters] = React.useState({
    status: 'all' as OrderStatus | 'all',
    productType: 'all' as ProductType | 'all',
    orderNumber: '',
  });

  // Для раздела "На изготовление" — только productionOrders
  const filteredProduction = React.useMemo(() => {
    return productionOrders.filter(order => {
      const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
      const orderNumberMatch = filters.orderNumber === '' || order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
      return productTypeMatch && orderNumberMatch;
    });
  }, [productionOrders, filters]);

  // Для остальных разделов — allOrders
  const filteredAll = React.useMemo(() => {
    return allOrders.filter(order => {
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
      const orderNumberMatch = filters.orderNumber === '' || order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
      return statusMatch && productTypeMatch && orderNumberMatch;
    });
  }, [allOrders, filters]);

  const ordersForProduction = filteredProduction;
  const ordersForShipment = React.useMemo(() => {
    return filteredAll
      .filter(order => order.status === 'Готов')
      .sort((a, b) => {
        if (!a.ready_at && !b.ready_at) return 0;
        if (!a.ready_at) return 1;
        if (!b.ready_at) return -1;
        return new Date(b.ready_at).getTime() - new Date(a.ready_at).getTime();
      });
  }, [filteredAll]);

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

      {loadOrdersButton && (
        <div className="mb-2">{loadOrdersButton}</div>
      )}

      <Filters onFilterChange={setFilters} currentFilters={filters} />
      
      <Tabs 
        defaultValue={printerTab} 
        className="w-full" 
        onValueChange={onTabChange ? (val => onTabChange(val as 'production'|'shipment'|'all')) : undefined}
      >
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
            <Badge variant="secondary" className="ml-1 text-xs">{filteredAll.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="production">
          <LoadingIndicator 
            isLoading={isLoadingProduction}
            dataCount={ordersForProduction.length}
            dataType="заказов"
            showCacheStatus={true}
          />
          <OrderTable 
            orders={ordersForProduction} 
            currentUser={currentUser} 
            onUpdateStatus={onUpdateStatus}
            useLargeLayout={true}
            isLoading={isLoadingProduction}
          />
        </TabsContent>
        <TabsContent value="shipment">
          <LoadingIndicator 
            isLoading={isLoadingAll}
            dataCount={ordersForShipment.length}
            dataType="заказов"
            showCacheStatus={true}
          />
          <OrderTable 
            orders={ordersForShipment} 
            currentUser={currentUser} 
            onUpdateStatus={onUpdateStatus}
            useLargeLayout={true}
            isLoading={isLoadingAll}
          />
        </TabsContent>
        <TabsContent value="all">
          <LoadingIndicator 
            isLoading={isLoadingAll}
            dataCount={filteredAll.length}
            dataType="заказов"
            showCacheStatus={true}
          />
          <OrderTable 
            orders={filteredAll} 
            currentUser={currentUser} 
            onUpdateStatus={onUpdateStatus}
            useLargeLayout={true}
            isLoading={isLoadingAll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
