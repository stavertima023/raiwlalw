
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  Send,
  XCircle,
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
  { label: string; color: 'primary' | 'secondary' | 'destructive' | 'outline' | 'default' }
> = {
  Добавлен: { label: 'Добавлен', color: 'primary' },
  Готов: { label: 'Готов', color: 'default' },
  Отправлен: { label: 'Отправлен', color: 'default'},
  Исполнен: { label: 'Исполнен', color: 'default'},
  Отменен: { label: 'Отменен', color: 'destructive' },
  Возврат: { label: 'Возврат', color: 'outline' },
};

const StatusBadge: React.FC<{ status: OrderStatus; useLargeLayout?: boolean }> = ({ status }) => {
  const { label, color } = statusConfig[status] || {};
  return (
    <Badge variant={color} className="capitalize whitespace-nowrap">
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
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="success">
                      <Check className="h-4 w-4" />
                      <span className="sr-only">Готов</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы собираетесь изменить статус заказа #{order.orderNumber} на "Готов".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Закрыть</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onUpdateStatus(order.id, 'Готов')}>
                        Подтвердить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
                 <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="success">
                      <Send className="h-4 w-4" />
                      <span className="sr-only">Отправлен</span>
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Вы собираетесь изменить статус заказа #{order.orderNumber} на "Отправлен".
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Закрыть</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onUpdateStatus(order.id, 'Отправлен')}>
                        Подтвердить
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
    <TableCell className={cn(useLargeLayout && 'w-[120px]')}>
      {currentUser.role === 'Принтовщик' ? (
        renderPrinterActions(order)
      ) : currentUser.role === 'Продавец' ? null : (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button aria-haspopup="true" size="icon" variant="ghost">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Edit className="mr-2 h-4 w-4" />
              Редактировать
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
        <CardDescription>
            {currentUser.role === 'Продавец' ? 'Список всех ваших заказов.' : 'Заказы, требующие вашего внимания.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {useLargeLayout && (
                <TableHead className="w-[120px]">
                  Действия
                </TableHead>
              )}
              <TableHead>Дата</TableHead>
              <TableHead>Номер заказа</TableHead>
              <TableHead>Номер отправления</TableHead>
              <TableHead className={cn(useLargeLayout && 'whitespace-nowrap w-[90px]')}>Статус</TableHead>
              <TableHead className={cn(useLargeLayout && 'p-2 w-[10px]')}>Тип</TableHead>
              <TableHead className={cn(useLargeLayout && 'p-2 w-[10px]')}>Размер</TableHead>
              <TableHead className={cn(useLargeLayout && 'w-[60px]')}>Продавец</TableHead>
              <TableHead className={cn('text-right', useLargeLayout && 'p-2 w-[60px]')}>Цена</TableHead>
              <TableHead className={cn(useLargeLayout && 'p-0 w-[100px]')}>Фото</TableHead>
              <TableHead>Комментарий</TableHead>
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
                  <TableCell className="whitespace-nowrap">
                    {order.orderNumber}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">{order.shipmentNumber || '–'}</TableCell>
                  <TableCell className={cn(useLargeLayout && 'whitespace-nowrap w-[90px]')}>
                    <StatusBadge status={order.status} />
                  </TableCell>
                  <TableCell className={cn(useLargeLayout && 'p-2 w-[10px]')}>{order.productType}</TableCell>
                  <TableCell className={cn(useLargeLayout && 'p-2 w-[10px]')}>{order.size}</TableCell>
                  <TableCell className={cn("whitespace-nowrap", useLargeLayout && 'w-[60px]')}>{order.seller}</TableCell>
                  <TableCell className={cn('text-right whitespace-nowrap', useLargeLayout && 'p-2 w-[60px]')}>
                    {order.price.toLocaleString('ru-RU')} ₽
                  </TableCell>
                  <TableCell className={cn(useLargeLayout && 'p-0 w-[100px]')}>
                    <div className="flex items-center gap-2">
                      {order.photos && order.photos.length > 0 ? (
                        order.photos.map((photo, index) => (
                          <Dialog key={index}>
                            <DialogTrigger asChild>
                              <button>
                                <Image
                                  src={photo}
                                  alt={`Фото ${index + 1}`}
                                  width={photoSize}
                                  height={photoSize}
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
                        <div className="rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs" style={{ height: photoSize, width: photoSize }}>
                          Нет фото
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="min-w-[150px] max-w-[300px] whitespace-pre-wrap break-words">
                    {order.comment || '–'}
                  </TableCell>
                  {!useLargeLayout && renderActionsCell(order)}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={12} className="h-24 text-center">
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
