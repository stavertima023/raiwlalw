
'use client';

import * as React from 'react';
import type { Order, User, OrderStatus } from '@/lib/types';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';

interface PrinterDashboardProps {
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  ordersForProduction: Order[];
  ordersForShipment: Order[];
  allOrders: Order[];
}

export function PrinterDashboard({
  currentUser,
  onUpdateStatus,
  ordersForProduction,
  ordersForShipment,
  allOrders,
}: PrinterDashboardProps) {
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
      
       <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="production">
            На изготовление
            <Badge variant="secondary" className="ml-2">{ordersForProduction.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shipment">
            На отправку
             <Badge variant="secondary" className="ml-2">{ordersForShipment.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all">Все заказы</TabsTrigger>
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
                orders={allOrders} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                useLargeLayout={true}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
