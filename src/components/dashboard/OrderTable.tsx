
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
  useLargeLayout?: boolean;
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

const StatusBadge: React.FC<{ status: OrderStatus; useLargeLayout?: boolean }> = ({ status, useLargeLayout }) => {
  const { label, color, icon: Icon } = statusConfig[status] || {};
  return (
    <Badge variant={color} className="capitalize whitespace-nowrap">
      {!useLargeLayout && <Icon className="mr-2 h-3.5 w-3.5" />}
      {label}
    </Badge>
  );
};

export const OrderTable: React.FC<OrderTableProps> = ({ orders, currentUser, onUpdateStatus, useLargeLayout = false }) => {
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
  
  const photoSize = useLargeLayout ? 100 : 60;

  const renderPrinterActions = (order: Order) => {
    const actions = getAvailableActions(order.status);
    if (!actions.length) return null;

    if (order.status === 'Добавлен') {
        return (
            <div className="flex gap-2">
                <Button size="icon" variant="success" onClick={() => onUpdateStatus(order.id, 'Готов')}>
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Готов</span>
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
                <Button size="icon" variant="success" onClick={() => onUpdateStatus(order.id, 'Отправлен')}>
                    <Send className="h-4 w-4" />
                     <span className="sr-only">Отправлен</span>
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

  const renderActionsCell = (order: Order) => (
    <TableCell className={cn(useLargeLayout && 'w-[180px]')}>
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
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Список заказов</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {useLargeLayout && (
                <TableHead className="w-[180px]">
                  Действия
                </TableHead>
              )}
              <TableHead>Дата</TableHead>
              <TableHead>Номер заказа</TableHead>
              <TableHead>Номер отправления</TableHead>
              <TableHead className={cn(useLargeLayout && 'whitespace-nowrap w-[120px]')}>Статус</TableHead>
              <TableHead className={cn(useLargeLayout && 'p-2 w-[25px]')}>Тип</TableHead>
              <TableHead className={cn(useLargeLayout && 'p-2 w-[20px]')}>Размер</TableHead>
              <TableHead className={cn(useLargeLayout && 'w-[80px]')}>Продавец</TableHead>
              <TableHead className={cn('text-right', useLargeLayout && 'p-2 w-[80px]')}>Цена</TableHead>
              <TableHead className={cn(useLargeLayout && 'w-[380px]')}>Фото</TableHead>
              {useLargeLayout && <TableHead className="w-[400px]" />}
              {!useLargeLayout && (
                <TableHead>
                  <span className="sr-only">Действия</span>
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id}>
                  {useLargeLayout && renderActionsCell(order)}
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(order.orderDate, 'd MMM yyyy', { locale: ru })}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{order.orderNumber}</TableCell>
                  <TableCell className="whitespace-nowrap">{order.shipmentNumber || '–'}</TableCell>
                  <TableCell className={cn(useLargeLayout && 'whitespace-nowrap w-[120px]')}>
                    <StatusBadge status={order.status} useLargeLayout={useLargeLayout} />
                  </TableCell>
                  <TableCell className={cn(useLargeLayout && 'p-2 w-[25px]')}>{order.productType}</TableCell>
                  <TableCell className={cn(useLargeLayout && 'p-2 w-[20px]')}>{order.size}</TableCell>
                  <TableCell className={cn("whitespace-nowrap", useLargeLayout && 'w-[80px]')}>{order.seller}</TableCell>
                  <TableCell className={cn('text-right whitespace-nowrap', useLargeLayout && 'p-2 w-[80px]')}>
                    {order.price.toLocaleString('ru-RU')} ₽
                  </TableCell>
                  <TableCell className={cn(useLargeLayout && 'w-[380px]')}>
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
                  {useLargeLayout && <TableCell className="w-[400px]" />}
                  {!useLargeLayout && renderActionsCell(order)}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={useLargeLayout ? 11 : 9} className="h-24 text-center">
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
