'use client';

import * as React from 'react';
import { Order, OrderStatus, ProductType } from '@/lib/types';
import { mockOrders } from '@/lib/data';
import Header from '@/components/dashboard/Header';
import Filters from '@/components/dashboard/Filters';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { v4 as uuidv4 } from 'uuid';

export default function Home() {
  const [orders, setOrders] = React.useState<Order[]>(mockOrders);
  const [filters, setFilters] = React.useState<{
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
  }>({
    status: 'all',
    productType: 'all',
  });

  const handleAddOrder = (newOrderData: Omit<Order, 'id' | 'orderDate'>) => {
    const newOrder: Order = {
      ...newOrderData,
      id: uuidv4(),
      orderDate: new Date(),
    };
    setOrders((prevOrders) => [newOrder, ...prevOrders]);
  };

  const filteredOrders = React.useMemo(() => {
    return orders
      .filter((order) => {
        const statusMatch = filters.status === 'all' || order.status === filters.status;
        const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
        return statusMatch && productTypeMatch;
      })
      .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
  }, [orders, filters]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onAddOrder={handleAddOrder} />
      <main className="flex-1 container mx-auto p-4 md:p-6 lg:p-8">
        <div className="space-y-6">
          <Filters onFilterChange={setFilters} />
          <OrderTable orders={filteredOrders} />
        </div>
      </main>
    </div>
  );
}
