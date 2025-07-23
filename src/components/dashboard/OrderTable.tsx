
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
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface OrderTableProps {
  orders: Order[];
  currentUser?: Omit<User, 'password_hash'>;
  selectedOrders?: string[];
  setSelectedOrders?: React.Dispatch<React.SetStateAction<string[]>>;
  onCancelOrder?: (orderNumber: string) => void;
  onReturnOrder?: (orderNumber: string) => void;
  onPayout?: (orderNumbers: string[]) => void;
  findOrder?: (orderNumber: string) => Order | undefined;
  findOrders?: (orderNumbers: string[]) => Order[];
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
  useLargeLayout?: boolean;
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  showSearch?: boolean;
  isLoading?: boolean;
}

const statusConfig: Record<
  OrderStatus,
  { label: string; color: 'secondary' | 'destructive' | 'outline' | 'default' | 'success' | 'warning' }
> = {
  Добавлен: { label: 'Добавлен', color: 'default' },
  Готов: { label: 'Готов', color: 'outline' },
  Отправлен: { label: 'Отправлен', color: 'warning'},
  Исполнен: { label: 'Исполнен', color: 'success'},
  Отменен: { label: 'Отменен', color: 'destructive' },
  Возврат: { label: 'Возврат', color: 'outline' },
};

// Мемоизированный компонент статуса
const StatusBadge = React.memo<{ status: OrderStatus; useLargeLayout?: boolean }>(({ status }) => {
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
});
StatusBadge.displayName = 'StatusBadge';

// Мемоизированный компонент фотографий
const OrderPhotos = React.memo<{ photos: string[]; size: number }>(({ photos, size }) => {
  if (!photos || photos.length === 0) {
    return (
      <div className="flex gap-1">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-muted rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
            style={{ width: size, height: size }}
          >
            <span className="text-xs text-muted-foreground">Фото {i}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1">
      {photos.map((photo, index) => (
        <div key={index} className="relative">
          <Dialog>
            <DialogTrigger asChild>
              <button className="block">
                <Image
                  src={photo}
                  alt={`Фото ${index + 1}`}
                  width={size}
                  height={size}
                  className="rounded object-cover cursor-pointer hover:opacity-80 transition-opacity"
                  style={{ width: size, height: size }}
                />
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 sm:max-w-2xl md:max-w-4xl">
              <DialogHeader>
                <DialogTitle>Фото {index + 1}</DialogTitle>
              </DialogHeader>
              <div className="flex justify-center items-center">
                <Image
                  src={photo}
                  alt={`Фото ${index + 1}`}
                  width={800}
                  height={800}
                  className="rounded-md object-contain max-w-full max-h-[70vh]"
                />
              </div>
            </DialogContent>
          </Dialog>
        </div>
      ))}
      {photos.length < 3 && (
        <div
          className="bg-muted rounded border-2 border-dashed border-muted-foreground/25 flex items-center justify-center"
          style={{ width: size, height: size }}
        >
          <span className="text-xs text-muted-foreground">Фото {photos.length + 1}</span>
        </div>
      )}
    </div>
  );
});
OrderPhotos.displayName = 'OrderPhotos';

// Выносим функцию renderActionsCell для использования в мобильной версии
const createRenderActionsCell = (
  currentUser: Omit<User, 'password_hash'> | undefined,
  onUpdateStatus: ((orderId: string, newStatus: OrderStatus) => void) | undefined
) => {
  const renderPrinterActions = (order: Order) => {
    if (order.status === 'Добавлен') {
      return (
        <div className="flex space-x-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="default">
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
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Готов')}>
                  Подтвердить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    if (order.status === 'Готов') {
      return (
        <div className="flex space-x-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="default">
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
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Отправлен')}>
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
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Отменен')}>
                  Подтвердить отмену
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    if (order.status === 'Отправлен') {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="outline">
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Возврат</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы собираетесь оформить возврат для заказа #{order.orderNumber}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Закрыть</AlertDialogCancel>
              <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Возврат')}>
                Подтвердить возврат
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return null;
  };

  const renderSellerActions = (order: Order) => {
    if (order.status === 'Отправлен') {
      return (
        <div className="flex space-x-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="default">
                <Check className="h-4 w-4" />
                <span className="sr-only">Исполнен</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы собираетесь изменить статус заказа #{order.orderNumber} на "Исполнен".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Закрыть</AlertDialogCancel>
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Исполнен')}>
                  Подтвердить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="outline">
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Возврат</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы собираетесь оформить возврат для заказа #{order.orderNumber}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Закрыть</AlertDialogCancel>
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Возврат')}>
                  Подтвердить возврат
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    if (order.status === 'Добавлен' || order.status === 'Готов') {
      return (
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
              <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Отменен')}>
                Подтвердить отмену
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return null;
  };

  return (order: Order) => {
    if (currentUser?.role === 'Принтовщик') {
      return renderPrinterActions(order);
    } else if (currentUser?.role === 'Продавец') {
      return renderSellerActions(order);
    }
    return null;
  };
};

// Компонент строки таблицы
const OrderTableRow = React.memo<{
  order: Order;
  currentUser?: Omit<User, 'password_hash'>;
  onUpdateStatus?: (orderId: string, newStatus: OrderStatus) => void;
  useLargeLayout?: boolean;
  photoSize: number;
}>(({ order, currentUser, onUpdateStatus, useLargeLayout, photoSize }) => {
  const renderPrinterActions = React.useCallback((order: Order) => {
    if (order.status === 'Добавлен') {
      return (
        <div className="flex space-x-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="default">
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
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Готов')}>
                  Подтвердить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    if (order.status === 'Готов') {
      return (
        <div className="flex space-x-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="default">
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
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Отправлен')}>
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
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Отменен')}>
                  Подтвердить отмену
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    if (order.status === 'Отправлен') {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="outline">
              <XCircle className="h-4 w-4" />
              <span className="sr-only">Возврат</span>
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
              <AlertDialogDescription>
                Вы собираетесь оформить возврат для заказа #{order.orderNumber}.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Закрыть</AlertDialogCancel>
              <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Возврат')}>
                Подтвердить возврат
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return null;
  }, [onUpdateStatus]);

  const renderSellerActions = React.useCallback((order: Order) => {
    if (order.status === 'Отправлен') {
      return (
        <div className="flex space-x-1">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="default">
                <Check className="h-4 w-4" />
                <span className="sr-only">Исполнен</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы собираетесь изменить статус заказа #{order.orderNumber} на "Исполнен".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Закрыть</AlertDialogCancel>
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Исполнен')}>
                  Подтвердить
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="icon" variant="outline">
                <XCircle className="h-4 w-4" />
                <span className="sr-only">Возврат</span>
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                  Вы собираетесь оформить возврат для заказа #{order.orderNumber}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Закрыть</AlertDialogCancel>
                <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Возврат')}>
                  Подтвердить возврат
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    if (order.status === 'Добавлен' || order.status === 'Готов') {
      return (
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
              <AlertDialogAction onClick={() => onUpdateStatus?.(order.id!, 'Отменен')}>
                Подтвердить отмену
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }

    return null;
  }, [onUpdateStatus]);

  const renderActionsCell = React.useCallback((order: Order) => {
    if (currentUser?.role === 'Принтовщик') {
      return renderPrinterActions(order);
    } else if (currentUser?.role === 'Продавец') {
      return renderSellerActions(order);
    }
    return null;
  }, [currentUser?.role, renderPrinterActions, renderSellerActions]);

  return (
    <TableRow key={order.id}>
      <TableCell className="font-medium">{order.orderNumber}</TableCell>
      <TableCell>{order.shipmentNumber}</TableCell>
      <TableCell>
        <StatusBadge status={order.status} useLargeLayout={useLargeLayout} />
      </TableCell>
      <TableCell>{order.productType}</TableCell>
      {currentUser?.role === 'Принтовщик' ? (
        <>
          <TableCell className="text-right">{order.price.toLocaleString('ru-RU')} ₽</TableCell>
          <TableCell>{order.seller}</TableCell>
          <TableCell>{order.size}</TableCell>
        </>
      ) : (
        <>
          <TableCell>{order.size}</TableCell>
          <TableCell>{order.seller}</TableCell>
          <TableCell className="text-right">{order.price.toLocaleString('ru-RU')} ₽</TableCell>
        </>
      )}
      <TableCell>
        <OrderPhotos photos={order.photos || []} size={photoSize} />
      </TableCell>
      <TableCell>{order.comment}</TableCell>
      {currentUser?.role === 'Принтовщик' && (
        <TableCell>
          {order.ready_at ? format(new Date(order.ready_at), 'dd.MM.yyyy HH:mm', { locale: ru }) : '–'}
        </TableCell>
      )}
      <TableCell>{format(new Date(order.orderDate), 'dd.MM.yyyy HH:mm', { locale: ru })}</TableCell>
      <TableCell>{renderActionsCell(order)}</TableCell>
    </TableRow>
  );
});
OrderTableRow.displayName = 'OrderTableRow';

export const OrderTable: React.FC<OrderTableProps> = React.memo(({ 
  orders, 
  currentUser, 
  onUpdateStatus, 
  useLargeLayout = false, 
  searchTerm = '', 
  onSearchChange, 
  showSearch = false,
  isLoading = false
}) => {
  const photoSize = useLargeLayout ? 100 : 60;
  const [currentPage, setCurrentPage] = React.useState(1);
  const [isMobile, setIsMobile] = React.useState(false);

  // Определяем мобильное устройство
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Сбрасываем страницу при изменении поиска
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Создаем функцию для рендеринга действий
  const renderActionsCell = createRenderActionsCell(currentUser, onUpdateStatus);

  // Мемоизированная фильтрация заказов
  const filteredOrders = React.useMemo(() => {
    if (!searchTerm.trim()) return orders;
    return orders.filter(order => 
      order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.shipmentNumber.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [orders, searchTerm]);

  // Пагинация для мобильной версии
  const ITEMS_PER_PAGE = 30;
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrders = isMobile ? filteredOrders.slice(startIndex, endIndex) : filteredOrders;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="lg" text="Загрузка заказов..." />
      </div>
    );
  }

  // Общий компонент поиска
  const SearchComponent = () => (
    showSearch && onSearchChange ? (
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Поиск по номеру заказа или отправления..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {searchTerm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onSearchChange('')}
            className="whitespace-nowrap"
          >
            Очистить
          </Button>
        )}
      </div>
    ) : null
  );

  // Компонент "заказы не найдены"
  const NoOrdersComponent = () => (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-8">
        <div className="text-center">
          <h3 className="text-lg font-semibold mb-2">Заказы не найдены</h3>
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Попробуйте изменить параметры поиска.' : 'Нет заказов для отображения.'}
          </p>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => onSearchChange?.('')}
            >
              Показать все заказы
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Если заказов нет, показываем поиск и сообщение
  if (filteredOrders.length === 0) {
    return (
      <div className="space-y-4">
        <SearchComponent />
        <NoOrdersComponent />
      </div>
    );
  }

  // Мобильная версия с карточками
  if (isMobile) {
    return (
      <div className="space-y-4">
        <SearchComponent />

        {/* Информация о пагинации */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Показано {startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} из {filteredOrders.length} заказов
          </span>
          <span>
            Страница {currentPage} из {totalPages}
          </span>
        </div>

        {/* Мобильные карточки заказов */}
        <div className="space-y-3">
          {paginatedOrders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="space-y-3">
                {/* Заголовок карточки */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">#{order.orderNumber}</span>
                    <StatusBadge status={order.status} />
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    {order.price.toLocaleString('ru-RU')} ₽
                  </span>
                </div>

                {/* Основная информация */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Отправление:</span>
                    <div className="font-medium">{order.shipmentNumber}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Товар:</span>
                    <div className="font-medium">{order.productType}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Размер:</span>
                    <div className="font-medium">{order.size}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Продавец:</span>
                    <div className="font-medium">{order.seller}</div>
                  </div>
                </div>

                {/* Фотографии */}
                <div>
                  <span className="text-muted-foreground text-sm">Фото:</span>
                  <div className="mt-1">
                    <OrderPhotos photos={order.photos || []} size={60} />
                  </div>
                </div>

                {/* Комментарий */}
                {order.comment && (
                  <div>
                    <span className="text-muted-foreground text-sm">Комментарий:</span>
                    <div className="text-sm mt-1">{order.comment}</div>
                  </div>
                )}

                {/* Время изготовления (для готовых заказов) */}
                {order.status === 'Готов' && order.ready_at && (
                  <div>
                    <span className="text-muted-foreground text-sm">Изготовлен:</span>
                    <div className="text-sm font-medium mt-1 text-blue-600">
                      {format(new Date(order.ready_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </div>
                  </div>
                )}

                {/* Время изготовления (для принтовщика - показываем для всех статусов) */}
                {currentUser?.role === 'Принтовщик' && order.ready_at && (
                  <div>
                    <span className="text-muted-foreground text-sm">Готовность:</span>
                    <div className="text-sm font-medium mt-1 text-blue-600">
                      {format(new Date(order.ready_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </div>
                  </div>
                )}

                {/* Дата добавления */}
                <div className="text-sm text-muted-foreground">
                  <span>Добавлен: </span>
                  <span className="font-medium">{format(new Date(order.orderDate), 'dd.MM.yyyy HH:mm', { locale: ru })}</span>
                </div>

                {/* Действия */}
                <div className="flex justify-end pt-2 border-t">
                  {renderActionsCell(order)}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Пагинация */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center space-x-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              Назад
            </Button>
            
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    variant={currentPage === pageNum ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              Вперед
            </Button>
          </div>
        )}
      </div>
    );
  }

  // Десктопная версия (без изменений)
  return (
    <div className="space-y-4">
      <SearchComponent />
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Номер заказа</TableHead>
              <TableHead>Номер отправления</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Тип товара</TableHead>
              {currentUser?.role === 'Принтовщик' ? (
                <>
                  <TableHead className="text-right">Цена</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead>Размер</TableHead>
                </>
              ) : (
                <>
                  <TableHead>Размер</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead className="text-right">Цена</TableHead>
                </>
              )}
              <TableHead>Фото</TableHead>
              <TableHead>Комментарий</TableHead>
              {currentUser?.role === 'Принтовщик' && (
                <TableHead>Время готовности</TableHead>
              )}
              <TableHead>Дата</TableHead>
              <TableHead>Действия</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <OrderTableRow
                key={order.id}
                order={order}
                currentUser={currentUser}
                onUpdateStatus={onUpdateStatus}
                useLargeLayout={useLargeLayout}
                photoSize={photoSize}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
});
OrderTable.displayName = 'OrderTable';
