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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  PlusCircle,
  CheckCircle2,
  Send,
  PackageCheck,
  XCircle,
  Undo2,
} from 'lucide-react';
import type { Order, OrderStatus } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface OrderTableProps {
  orders: Order[];
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: 'primary' | 'secondary' | 'destructive' | 'outline' | 'default', icon: React.ElementType }
> = {
  Добавлен: { label: 'Добавлен', color: 'primary', icon: PlusCircle },
  Готов: { label: 'Готов', color: 'default', icon: CheckCircle2 },
  Отправлен: { label: 'Отправлен', color: 'default', icon: Send },
  Исполнен: { label: 'Исполнен', color: 'default', icon: PackageCheck },
  Отменен: { label: 'Отменен', color: 'destructive', icon: XCircle },
  Возврат: { label: 'Возврат', color: 'outline', icon: Undo2 },
};

const StatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const { label, color, icon: Icon } = statusConfig[status] || {};
  return (
    <Badge variant={color} className="capitalize whitespace-nowrap">
      <Icon className="mr-2 h-3.5 w-3.5" />
      {label}
    </Badge>
  );
};

export const OrderTable: React.FC<OrderTableProps> = ({ orders }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Список заказов</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative w-full overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Номер заказа</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Тип</TableHead>
                <TableHead>Размер</TableHead>
                <TableHead>Продавец</TableHead>
                <TableHead className="text-right">Цена</TableHead>
                <TableHead className="text-right">Себест.</TableHead>
                <TableHead>Фото</TableHead>
                <TableHead>
                  <span className="sr-only">Действия</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length > 0 ? (
                orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(order.orderDate, 'd MMM yyyy', { locale: ru })}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{order.orderNumber}</TableCell>
                    <TableCell>
                      <StatusBadge status={order.status} />
                    </TableCell>
                    <TableCell>{order.productType}</TableCell>
                    <TableCell>{order.size}</TableCell>
                    <TableCell className="whitespace-nowrap">{order.seller}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {order.price.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {order.cost.toLocaleString('ru-RU')} ₽
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.photos && order.photos.length > 0 ? (
                          order.photos.map((photo, index) => (
                            <Image
                              key={index}
                              src={photo}
                              alt={`Фото ${index + 1}`}
                              width={40}
                              height={40}
                              className="rounded-md object-cover"
                              data-ai-hint="product photo"
                            />
                          ))
                        ) : (
                          <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs">
                            Нет фото
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>Редактировать</DropdownMenuItem>
                          <DropdownMenuItem>Удалить</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10} className="h-24 text-center">
                    Нет заказов для отображения.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
