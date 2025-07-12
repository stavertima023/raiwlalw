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
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  MoreHorizontal,
  PlusCircle,
  CheckCircle2,
  Send,
  PackageCheck,
  XCircle,
  Undo2,
  Edit,
  Check,
  X,
} from 'lucide-react';
import type { Order, OrderStatus, User } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface OrderTableProps {
  orders: Order[];
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  largePhotos?: boolean;
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

export const OrderTable: React.FC<OrderTableProps> = ({ orders, currentUser, onUpdateStatus, largePhotos = false }) => {
  const getAvailableActions = (orderStatus: OrderStatus): OrderStatus[] => {
    switch (orderStatus) {
      case 'Добавлен':
        return ['Готов', 'Отменен'];
      case 'Готов':
        return ['Отправлен', 'Отменен'];
      case 'Отправлен':
        return ['Возврат'];
      default:
        return [];
    }
  };
  
  const photoSize = largePhotos ? 100 : 60;

  const renderPrinterActions = (order: Order) => {
    const actions = getAvailableActions(order.status);
    if (!actions.length) return null;

    if (order.status === 'Добавлен') {
        return (
            <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => onUpdateStatus(order.id, 'Готов')}>
                    <Check className="mr-2 h-4 w-4" /> Готов
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Отменить</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы собираетесь отменить заказ #{order.orderNumber}. Это действие нельзя будет отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Закрыть</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onUpdateStatus(order.id, 'Отменен')}>
                        Подтвердить отмену
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }

    if (order.status === 'Готов') {
        return (
            <div className="flex gap-2">
                <Button size="sm" variant="success" onClick={() => onUpdateStatus(order.id, 'Отправлен')}>
                    <Send className="mr-2 h-4 w-4" /> Отправлен
                </Button>
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive">
                      <X className="h-4 w-4" />
                      <span className="sr-only">Отменить</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы собираетесь отменить заказ #{order.orderNumber}. Это действие нельзя будет отменить.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Закрыть</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onUpdateStatus(order.id, 'Отменен')}>
                        Подтвердить отмену
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        )
    }

    // Fallback to dropdown for other statuses for now
    return (
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
            <MoreHorizontal className="h-4 w-4" />
            <span className="sr-only">Toggle menu</span>
            </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
            {actions.map((actionStatus) => (
            <DropdownMenuItem
                key={actionStatus}
                onClick={() => onUpdateStatus(order.id, actionStatus)}
            >
                Изменить на "{actionStatus}"
            </DropdownMenuItem>
            ))}
        </DropdownMenuContent>
        </DropdownMenu>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Список заказов</CardTitle>
      </CardHeader>
      <CardContent>
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
              <TableHead className={cn(largePhotos && 'w-[380px]')}>Фото</TableHead>
              {largePhotos && <TableHead className="w-[200px]" />}
              <TableHead className={cn(largePhotos && 'w-[100px]')}>
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
                  <TableCell className={cn(largePhotos && 'w-[380px]')}>
                    <div className="flex items-center gap-2">
                      {order.photos && order.photos.length > 0 ? (
                        order.photos.map((photo, index) => (
                          <Image
                            key={index}
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            width={photoSize}
                            height={photoSize}
                            className="rounded-md object-cover"
                            data-ai-hint="product photo"
                          />
                        ))
                      ) : (
                        <div className="rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs" style={{ height: photoSize, width: photoSize }}>
                          Нет фото
                        </div>
                      )}
                    </div>
                  </TableCell>
                  {largePhotos && <TableCell />}
                  <TableCell className={cn(largePhotos && 'w-[100px]')}>
                    {currentUser.role === 'Принтовщик' ? (
                      renderPrinterActions(order)
                    ) : (
                      <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost" disabled={currentUser.role !== 'Продавец'}>
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Редактировать
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive">
                          <XCircle className="mr-2 h-4 w-4" />
                          Отменить заказ
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={largePhotos ? 11 : 10} className="h-24 text-center">
                  Нет заказов для отображения.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
