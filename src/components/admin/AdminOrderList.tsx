
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { Order, OrderStatus, ProductType, SortDescriptor, User } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import AdminOrderFilters from './AdminOrderFilters';

interface AdminOrderListProps {
  allOrders: Order[];
  allUsers: User[];
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: 'secondary' | 'destructive' | 'outline' | 'default' | 'success' | 'warning' }
> = {
  Добавлен: { label: 'Добавлен', color: 'default' },
  Готов: { label: 'Готов', color: 'outline' },
  Отправлен: { label: 'Отправлен', color: 'warning' },
  Исполнен: { label: 'Исполнен', color: 'success' },
  Отменен: { label: 'Отменен', color: 'destructive' },
  Возврат: { label: 'Возврат', color: 'outline' },
};

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const { label, color } = statusConfig[status] || {};
  const isReadyStatus = status === 'Готов';
  return (
    <Badge 
      variant={color} 
      className={`capitalize whitespace-nowrap ${isReadyStatus ? 'border-blue-500 text-white bg-blue-500' : ''}`}
    >
      {label}
    </Badge>
  );
};

export const AdminOrderList: React.FC<AdminOrderListProps> = ({ allOrders, allUsers }) => {
  const [filters, setFilters] = React.useState({
    status: 'all' as OrderStatus | 'all',
    productType: 'all' as ProductType | 'all',
    seller: 'all' as string | 'all',
    orderNumber: '',
  });

  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'orderDate',
    direction: 'desc',
  });

  const handleSort = (column: keyof Order) => {
    const isAsc = sortDescriptor.column === column && sortDescriptor.direction === 'asc';
    setSortDescriptor({ column, direction: isAsc ? 'desc' : 'asc' });
  };
  
  const sellerMap = React.useMemo(() => {
    return allUsers.reduce((acc, user) => {
      acc[user.username] = user.name;
      return acc;
    }, {} as Record<string, string>);
  }, [allUsers]);

  const filteredAndSortedOrders = React.useMemo(() => {
    let filtered = [...allOrders];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }
    if (filters.productType !== 'all') {
      filtered = filtered.filter(order => order.productType === filters.productType);
    }
    if (filters.seller !== 'all') {
      filtered = filtered.filter(order => order.seller === filters.seller);
    }
    if (filters.orderNumber) {
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortDescriptor.column] ?? 0;
      const bValue = b[sortDescriptor.column] ?? 0;
      
      let cmp = 0;
      if (aValue > bValue) cmp = 1;
      if (aValue < bValue) cmp = -1;

      return sortDescriptor.direction === 'desc' ? -cmp : cmp;
    });

    return filtered;
  }, [allOrders, filters, sortDescriptor]);

  const renderSortableHeader = (column: keyof Order, label: string) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className="-ml-4"
      >
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <AdminOrderFilters 
        onFilterChange={setFilters}
        currentFilters={filters}
        allUsers={allUsers}
      />
      <Card>
        <CardHeader>
          <CardTitle>Список всех заказов</CardTitle>
          <CardDescription>
            Просмотр, фильтрация и сортировка всех заказов в системе.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {renderSortableHeader('orderDate', 'Дата')}
                {renderSortableHeader('orderNumber', 'Номер заказа')}
                <TableHead>Номер отправления</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Размер</TableHead>
                <TableHead>Продавец</TableHead>
                {renderSortableHeader('price', 'Цена')}
                <TableHead className="text-right">Себест.</TableHead>
                <TableHead>Фото</TableHead>
                <TableHead>Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedOrders.length > 0 ? (
                filteredAndSortedOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(order.orderDate, 'd MMM yyyy, HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {order.orderNumber}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{order.shipmentNumber || '–'}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{order.productType}</TableCell>
                    <TableCell>{order.size}</TableCell>
                    <TableCell className="whitespace-nowrap">{sellerMap[order.seller] || order.seller}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {order.price.toLocaleString('ru-RU')} ₽
                    </TableCell>
                     <TableCell className="text-right whitespace-nowrap">
                      {order.cost ? `${order.cost.toLocaleString('ru-RU')} ₽` : '–'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.photos && order.photos.length > 0 ? (
                          order.photos.map((photo, index) => (
                            <Dialog key={index}>
                              <DialogTrigger asChild>
                                <button>
                                  <Image
                                    src={photo}
                                    alt={`Фото ${index + 1}`}
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover cursor-pointer"
                                    data-ai-hint="product photo"
                                  />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md p-2 sm:max-w-lg md:max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Фото заказа #{order.orderNumber}</DialogTitle>
                                </DialogHeader>
                                <div className="flex justify-center">
                                  <Image
                                    src={photo}
                                    alt={`Фото ${index + 1}`}
                                    width={800}
                                    height={800}
                                    className="rounded-md object-contain max-h-[80vh]"
                                    data-ai-hint="product photo"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                          ))
                        ) : (
                          <div className="rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs h-10 w-10">
                            Нет
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[150px] max-w-[300px] whitespace-pre-wrap break-words">
                      {order.comment || '–'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={11} className="h-24 text-center">
                    Нет заказов для отображения по заданным фильтрам.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
