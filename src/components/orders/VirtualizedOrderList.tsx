'use client';

import React from 'react';
import { FixedSizeList as List } from 'react-window';
import { Order, User, OrderStatus } from '@/lib/types';
import { OrderTableRow } from '@/components/dashboard/OrderTable';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface VirtualizedOrderListProps {
  orders: Order[];
  currentUser?: Omit<User, 'password_hash'>;
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
  isLoading?: boolean;
  height?: number;
  itemHeight?: number;
}

const OrderRow = React.memo<{
  index: number;
  style: React.CSSProperties;
  data: {
    orders: Order[];
    currentUser?: Omit<User, 'password_hash'>;
    onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
  };
}>(({ index, style, data }) => {
  const { orders, currentUser, onUpdateStatus } = data;
  const order = orders[index];

  if (!order) return null;

  return (
    <div style={style} className="px-4 py-2">
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Номер заказа</div>
              <div className="font-medium">{order.orderNumber}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Статус</div>
              <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {order.status}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Тип</div>
              <div>{order.productType}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Цена</div>
              <div className="font-medium">{order.price.toLocaleString('ru-RU')} ₽</div>
            </div>
          </div>
          
          {onUpdateStatus && (
            <div className="mt-4 flex gap-2">
              {order.status === 'Добавлен' && (
                <button
                  onClick={() => onUpdateStatus(order.id!, 'Готов')}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Готов
                </button>
              )}
              {order.status === 'Готов' && (
                <button
                  onClick={() => onUpdateStatus(order.id!, 'Отправлен')}
                  className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  Отправлен
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

OrderRow.displayName = 'OrderRow';

export function VirtualizedOrderList({
  orders,
  currentUser,
  onUpdateStatus,
  isLoading = false,
  height = 600,
  itemHeight = 120
}: VirtualizedOrderListProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" text="Загрузка заказов..." />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-center">
            <h3 className="text-lg font-semibold mb-2">Заказы не найдены</h3>
            <p className="text-muted-foreground">
              Нет заказов для отображения.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const itemData = {
    orders,
    currentUser,
    onUpdateStatus
  };

  return (
    <div className="w-full">
      <List
        height={height}
        itemCount={orders.length}
        itemSize={itemHeight}
        itemData={itemData}
        width="100%"
        overscanCount={5}
      >
        {OrderRow}
      </List>
    </div>
  );
} 