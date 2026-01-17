
'use client';

import * as React from 'react';
import type { Order, User, OrderStatus, ProductType } from '@/lib/types';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, AlertCircle, CheckCircle, Send, Check, X, Search, ArrowUpAZ, ArrowDownAZ, Warehouse, PackageCheck } from 'lucide-react';
import { AddToWarehouseDialog } from './AddToWarehouseDialog';
import { AddManualWarehouseOrderDialog } from './AddManualWarehouseOrderDialog';
import useSWR from 'swr';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ChevronDown } from 'lucide-react';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface PrinterDashboardProps {
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  allOrders: Order[];
  isLoading?: boolean;
}

// Мобильная версия компонента для стабильности
const MobilePrinterView = React.memo<{
  orders: Order[];
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  isLoading: boolean;
  title: string;
  description: string;
  onUseFromWarehouse?: (orderId: string) => void;
  showWarehouseActions?: boolean;
}>(({ orders, currentUser, onUpdateStatus, isLoading, title, description, onUseFromWarehouse, showWarehouseActions }) => {
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);
  const [updatingCheckbox, setUpdatingCheckbox] = React.useState<string | null>(null);

  // Защита от ошибок
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Ошибка загрузки',
        description: error,
        variant: 'destructive',
      });
      setError(null);
    }
  }, [error, toast]);

  // Обработка ошибок обновления статуса
  const handleStatusUpdate = React.useCallback(async (orderId: string, newStatus: OrderStatus) => {
    try {
      await onUpdateStatus(orderId, newStatus);
      toast({
        title: 'Статус обновлен',
        description: 'Заказ успешно обновлен',
      });
    } catch (err) {
      console.error('Ошибка обновления статуса:', err);
      setError('Не удалось обновить статус заказа');
    }
  }, [onUpdateStatus, toast]);

  // Обработка обновления чекбокса принтовщика
  const handlePrinterCheckUpdate = React.useCallback(async (orderId: string, checked: boolean) => {
    try {
      setUpdatingCheckbox(orderId);
      
      const response = await fetch(`/api/orders/${orderId}/printer-check`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ checked }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Не удалось обновить отметку');
      }

      // Успешно обновлено - обновляем локальное состояние
      const orderIndex = orders.findIndex(order => order.id === orderId);
      if (orderIndex !== -1) {
        orders[orderIndex].printerChecked = checked;
      }

      toast({
        title: checked ? 'Заказ отмечен' : 'Отметка снята',
        description: checked ? 'Заказ помечен как выполненный' : 'Отметка удалена',
      });
    } catch (err) {
      console.error('Ошибка обновления отметки принтовщика:', err);
      toast({
        title: 'Ошибка',
        description: err instanceof Error ? err.message : 'Не удалось обновить отметку',
        variant: 'destructive',
      });
    } finally {
      setUpdatingCheckbox(null);
    }
  }, [orders, toast]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-gray-200 rounded-md"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Нет заказов для отображения
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4 space-y-3">
              {/* Заголовок с номером и статусом */}
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">#{order.orderNumber}</h3>
                  <p className="text-sm text-muted-foreground">
                    Отправление: {order.shipmentNumber}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(order.orderDate, 'd MMM yyyy, HH:mm', { locale: ru })}
                  </p>
                  {/* Дата изготовления для готовых заказов */}
                  {order.status === 'Готов' && order.ready_at && (
                    <p className="text-xs text-blue-600">
                      Изготовлен: {format(new Date(order.ready_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  )}
                </div>
                <Badge variant={order.status === 'Готов' ? 'outline' : 'default'}>
                  {order.status}
                </Badge>
              </div>
              
              {/* Фото заказа с чекбоксом */}
              <div className="flex items-start gap-3">
                {/* Чекбокс принтовщика */}
                <div className="flex-shrink-0 pt-1">
                  <Checkbox
                    id={`printer-check-${order.id}`}
                    checked={order.printerChecked || false}
                    onCheckedChange={(checked) => handlePrinterCheckUpdate(order.id!, !!checked)}
                    disabled={updatingCheckbox === order.id}
                    className="w-5 h-5"
                  />
                  <label 
                    htmlFor={`printer-check-${order.id}`}
                    className="text-xs text-muted-foreground mt-1 block cursor-pointer"
                  >
                    Отметка
                  </label>
                </div>

                {/* Фото заказа */}
                {order.photos && order.photos.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                    {order.photos.map((photo, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div className="relative flex-shrink-0 cursor-pointer group">
                          <img
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className={`${showWarehouseActions ? 'w-32 h-32' : 'w-16 h-16'} object-cover rounded-md border transition-transform group-hover:scale-105`}
                            loading="lazy"
                          />
                          {order.photos.length > 1 && index === 0 && (
                            <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                              +{order.photos.length - 1}
                            </div>
                          )}
                          {/* Индикатор клика */}
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center rounded-md">
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs">
                              Просмотр
                            </div>
                          </div>
                        </div>
                      </DialogTrigger>
                      <DialogContent className="max-w-[95vw] max-h-[80vh] p-4 sm:max-w-2xl md:max-w-3xl" onPointerDownOutside={(e) => e.preventDefault()}>
                        <DialogHeader>
                          <DialogTitle className="flex items-center justify-between">
                            <span>Фото заказа #{order.orderNumber}</span>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-8 w-8 p-0 border-2 hover:bg-red-50 hover:border-red-300">
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </DialogTrigger>
                          </DialogTitle>
                        </DialogHeader>
                        <div className="relative">
                          <img
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className="w-full h-auto rounded-md max-h-[60vh] object-contain"
                            loading="eager"
                          />
                          {/* Навигация по фото если их несколько */}
                          {order.photos.length > 1 && (
                            <div className="flex justify-center gap-2 mt-4">
                              {order.photos.map((_, photoIndex) => (
                                <div
                                  key={photoIndex}
                                  className={`w-2 h-2 rounded-full ${
                                    photoIndex === index ? 'bg-blue-500' : 'bg-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Основная информация */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Тип:</span>
                  <span className="ml-1 font-medium">{order.productType}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Размер:</span>
                  <span className="ml-1 font-medium">{order.size}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Цена:</span>
                  <span className="ml-1 font-medium">{order.price.toLocaleString('ru-RU')} ₽</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Продавец:</span>
                  <span className="ml-1 font-medium">{order.seller}</span>
                </div>
              </div>

              {/* Комментарий */}
              {order.comment && (
                <div className="text-sm">
                  <span className="text-muted-foreground">Комментарий:</span>
                  <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                    {order.comment}
                  </p>
                </div>
              )}

              {/* Действия для принтовщика */}
              <div className="flex gap-2 pt-2">
                {showWarehouseActions && onUseFromWarehouse && order.on_warehouse ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => onUseFromWarehouse(order.id!)}
                    className="flex-1"
                  >
                    <PackageCheck className="h-4 w-4 mr-1" />
                    Использовать
                  </Button>
                ) : (
                  <>
                    {order.status === 'Добавлен' && (
                      <Button
                        size="sm"
                        onClick={() => handleStatusUpdate(order.id!, 'Готов')}
                        className="flex-1"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Готов
                      </Button>
                    )}
                    {order.status === 'Готов' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(order.id!, 'Отправлен')}
                        className="flex-1"
                      >
                        <Send className="h-4 w-4 mr-1" />
                        Отправить
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
});

MobilePrinterView.displayName = 'MobilePrinterView';

export function PrinterDashboard({
  currentUser,
  onUpdateStatus,
  allOrders,
  isLoading = false,
}: PrinterDashboardProps) {
  const [filters, setFilters] = React.useState({
    status: 'all' as OrderStatus | 'all',
    productType: 'all' as ProductType | 'all',
    orderNumber: '',
  });
  
  const [searchTerm, setSearchTerm] = React.useState('');
  const [shipmentSearch, setShipmentSearch] = React.useState('');
  const [sellerFilter, setSellerFilter] = React.useState<string>('all');
  const [productTypeFilters, setProductTypeFilters] = React.useState<string[]>([]);
  const [productTypePopoverOpen, setProductTypePopoverOpen] = React.useState(false);
  const [pvzFilter, setPvzFilter] = React.useState<string>('all');
  const { toast } = useToast();

  // Загружаем заказы на складе
  const { data: warehouseOrders = [], mutate: mutateWarehouse } = useSWR<Order[]>(
    '/api/warehouse/orders',
    async (url) => {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Ошибка загрузки заказов со склада');
      return res.json();
    },
    { refreshInterval: 30000 } // Обновляем каждые 30 секунд
  );

  // Функция для использования заказа со склада
  const handleUseFromWarehouse = React.useCallback(async (orderId: string) => {
    try {
      const response = await fetch('/api/warehouse/use', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка использования заказа');
      }

      toast({
        title: 'Заказ использован',
        description: 'Заказ успешно убран со склада',
      });

      // Обновляем список заказов на складе
      mutateWarehouse();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось использовать заказ',
        variant: 'destructive',
      });
    }
  }, [toast, mutateWarehouse]);

  const uniqueProductTypes = React.useMemo(() => {
    return Array.from(new Set(allOrders.map(o => o.productType).filter(Boolean))).sort((a, b) => a.localeCompare(b));
  }, [allOrders]);

  // Защита от ошибок и стабилизация
  const [error, setError] = React.useState<string | null>(null);
  const [isMobile, setIsMobile] = React.useState(false);

  // Определяем мобильное устройство
  React.useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || 
        /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Функция определения ПВЗ по номеру отправления
  const getPvzType = React.useCallback((shipmentNumber: string | undefined | null): string => {
    if (!shipmentNumber || shipmentNumber.trim() === '') return 'other';
    const firstChar = shipmentNumber.trim().charAt(0).toUpperCase();
    if (firstChar === 'P' || firstChar === '5') return 'avito-yandex';
    if (firstChar === '8') return 'russian-post';
    if (firstChar === '1') return 'sdek';
    return 'other';
  }, []);

  // Стабилизированная фильтрация с защитой от ошибок
  const filteredOrders = React.useMemo(() => {
    try {
    const base = allOrders.filter(order => {
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
      const orderNumberMatch = filters.orderNumber === '' || 
        order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
      // Добавляем поиск по номеру заказа
      const searchMatch = searchTerm === '' || 
        order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());
      // Поиск по номеру отправления
      const shipmentMatch = shipmentSearch === '' || (order.shipmentNumber || '').toLowerCase().includes(shipmentSearch.toLowerCase());
      const sellerMatch = sellerFilter === 'all' || (order.seller || '') === sellerFilter;
      const productTypeMultiMatch = productTypeFilters.length === 0 || productTypeFilters.includes(order.productType);
      // Фильтр по ПВЗ
      const pvzMatch = pvzFilter === 'all' || getPvzType(order.shipmentNumber) === pvzFilter;
      return statusMatch && productTypeMatch && orderNumberMatch && searchMatch && shipmentMatch && sellerMatch && productTypeMultiMatch && pvzMatch;
    });
    return base;
    } catch (err) {
      console.error('Ошибка фильтрации заказов:', err);
      setError('Ошибка при фильтрации заказов');
      return [];
    }
  }, [allOrders, filters, searchTerm, shipmentSearch, sellerFilter, productTypeFilters, pvzFilter, getPvzType]);

  const ordersForProduction = React.useMemo(() => {
    try {
    return filteredOrders
        .filter(order => order.status === 'Добавлен')
        .sort((a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime());
        // Убираем .slice(0, isMobile ? 30 : 100) - ограничение теперь на уровне API
    } catch (err) {
      console.error('Ошибка обработки заказов на производство:', err);
      return [];
    }
  }, [filteredOrders]);
  
  const ordersForShipment = React.useMemo(() => {
    try {
    return filteredOrders
        .filter(order => order.status === 'Готов')
        .sort((a, b) => {
          if (!a.ready_at && !b.ready_at) return 0;
          if (!a.ready_at) return 1;
          if (!b.ready_at) return -1;
          return new Date(b.ready_at).getTime() - new Date(a.ready_at).getTime();
        });
        // Убираем .slice(0, isMobile ? 30 : 100) - ограничение теперь на уровне API
    } catch (err) {
      console.error('Ошибка обработки заказов на отправку:', err);
      return [];
    }
  }, [filteredOrders]);

  // Обработка ошибок загрузки
  if (isLoading && allOrders.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Рабочая область Принтовщика</CardTitle>
            <CardDescription>
              Загрузка заказов...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Мобильная версия - упрощенная и стабильная
  if (isMobile) {
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

        {/* Индикатор загрузки */}
        <LoadingIndicator 
          isLoading={isLoading}
          dataCount={allOrders.length}
          dataType="заказов"
          showCacheStatus={true}
        />

        {/* Поиск и сортировка для мобильной версии */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру заказа..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по номеру отправления..."
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Продавец:</span>
              <Select value={sellerFilter} onValueChange={setSellerFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Все продавцы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все продавцы</SelectItem>
                  {Array.from(new Set(allOrders.map(o => o.seller || '').filter(Boolean)))
                    .sort((a, b) => a.localeCompare(b))
                    .map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Типы:</span>
              <Popover open={productTypePopoverOpen} onOpenChange={setProductTypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between w-full sm:w-[220px]">
                    {productTypeFilters.length === 0 ? 'Все типы' : `Выбрано: ${productTypeFilters.length}`}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-2">
                  <div className="max-h-56 overflow-y-auto pr-1">
                    {uniqueProductTypes.map(type => {
                      const checked = productTypeFilters.includes(type);
                      return (
                        <label key={type} className="flex items-center gap-2 py-1 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setProductTypeFilters(prev => {
                                const isChecked = !!c;
                                if (isChecked && !prev.includes(type)) return [...prev, type];
                                if (!isChecked) return prev.filter(t => t !== type);
                                return prev;
                              });
                            }}
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-between gap-2 mt-2">
                    <Button size="sm" variant="secondary" onClick={() => setProductTypeFilters([])}>Сбросить</Button>
                    <Button size="sm" onClick={() => setProductTypePopoverOpen(false)}>Готово</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">ПВЗ:</span>
              <Select value={pvzFilter} onValueChange={setPvzFilter}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Все ПВЗ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все ПВЗ</SelectItem>
                  <SelectItem value="avito-yandex">Авито/Яндекс</SelectItem>
                  <SelectItem value="russian-post">Почта России</SelectItem>
                  <SelectItem value="sdek">Сдэк</SelectItem>
                  <SelectItem value="other">Прочее</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Кнопки пополнить склад */}
        <Card>
          <CardContent className="p-4 flex gap-2 flex-wrap">
            <AddToWarehouseDialog onSuccess={() => mutateWarehouse()} />
            <AddManualWarehouseOrderDialog onSuccess={() => mutateWarehouse()} />
          </CardContent>
        </Card>

        {/* Мобильные вкладки */}
        <Tabs defaultValue="production" className="w-full">
          <TabsList className="grid w-full grid-cols-4 gap-1 p-1">
            <TabsTrigger value="production" className="text-xs px-2 py-1">
              Изготовление
              <Badge variant="secondary" className="ml-1 text-xs">{ordersForProduction.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="shipment" className="text-xs px-2 py-1">
              Отправка
              <Badge variant="secondary" className="ml-1 text-xs">{ordersForShipment.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="warehouse" className="text-xs px-2 py-1">
              Склад
              <Badge variant="secondary" className="ml-1 text-xs">{warehouseOrders.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs px-2 py-1">
              Все
              <Badge variant="secondary" className="ml-1 text-xs">{filteredOrders.length}</Badge>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="production">
            <MobilePrinterView
              orders={ordersForProduction}
              currentUser={currentUser}
              onUpdateStatus={onUpdateStatus}
              isLoading={isLoading}
              title="Заказы на изготовление"
              description="Заказы, требующие изготовления"
            />
          </TabsContent>
          
          <TabsContent value="shipment">
            <MobilePrinterView
              orders={ordersForShipment}
              currentUser={currentUser}
              onUpdateStatus={onUpdateStatus}
              isLoading={isLoading}
              title="Заказы на отправку"
              description="Готовые заказы для отправки"
            />
          </TabsContent>
          
          <TabsContent value="warehouse">
            <MobilePrinterView
              orders={warehouseOrders}
              currentUser={currentUser}
              onUpdateStatus={onUpdateStatus}
              isLoading={isLoading}
              title="Склад"
              description="Заказы на складе"
              onUseFromWarehouse={handleUseFromWarehouse}
              showWarehouseActions={true}
            />
          </TabsContent>
          <TabsContent value="all">
            <MobilePrinterView
              orders={filteredOrders} // Убираем .slice(0, 50) - ограничение теперь на уровне API
              currentUser={currentUser}
              onUpdateStatus={onUpdateStatus}
              isLoading={isLoading}
              title="Все заказы"
              description="Все заказы в системе"
            />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  // Десктопная версия - оптимизированная для полной ширины экрана
  return (
    <div className="space-y-6 w-full max-w-none">
       <Card>
        <CardHeader>
          <CardTitle>Рабочая область Принтовщика</CardTitle>
          <CardDescription>
            Здесь отображаются заказы, требующие вашего внимания.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Индикатор загрузки */}
      <LoadingIndicator 
        isLoading={isLoading}
        dataCount={allOrders.length}
        dataType="заказов"
        showCacheStatus={true}
      />

      {/* Поиск по номеру заказа - компактная версия */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Поиск и сортировка</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Номер заказа..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Номер отправления..."
                value={shipmentSearch}
                onChange={(e) => setShipmentSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Продавец:</span>
              <Select value={sellerFilter} onValueChange={setSellerFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все продавцы" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все продавцы</SelectItem>
                  {Array.from(new Set(allOrders.map(o => o.seller || '').filter(Boolean)))
                    .sort((a, b) => a.localeCompare(b))
                    .map(name => (
                      <SelectItem key={name} value={name}>{name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">Типы:</span>
              <Popover open={productTypePopoverOpen} onOpenChange={setProductTypePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-between w-full">
                    {productTypeFilters.length === 0 ? 'Все типы' : `${productTypeFilters.length}`}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-2">
                  <div className="max-h-56 overflow-y-auto pr-1">
                    {uniqueProductTypes.map(type => {
                      const checked = productTypeFilters.includes(type);
                      return (
                        <label key={type} className="flex items-center gap-2 py-1 cursor-pointer">
                          <Checkbox
                            checked={checked}
                            onCheckedChange={(c) => {
                              setProductTypeFilters(prev => {
                                const isChecked = !!c;
                                if (isChecked && !prev.includes(type)) return [...prev, type];
                                if (!isChecked) return prev.filter(t => t !== type);
                                return prev;
                              });
                            }}
                          />
                          <span className="text-sm">{type}</span>
                        </label>
                      );
                    })}
                  </div>
                  <div className="flex justify-between gap-2 mt-2">
                    <Button size="sm" variant="secondary" onClick={() => setProductTypeFilters([])}>Сбросить</Button>
                    <Button size="sm" onClick={() => setProductTypePopoverOpen(false)}>Готово</Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">ПВЗ:</span>
              <Select value={pvzFilter} onValueChange={setPvzFilter}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Все ПВЗ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все ПВЗ</SelectItem>
                  <SelectItem value="avito-yandex">Авито/Яндекс</SelectItem>
                  <SelectItem value="russian-post">Почта России</SelectItem>
                  <SelectItem value="sdek">Сдэк</SelectItem>
                  <SelectItem value="other">Прочее</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
       {/* Кнопки пополнить склад */}
       <Card>
         <CardContent className="p-4 flex gap-2">
           <AddToWarehouseDialog onSuccess={() => mutateWarehouse()} />
           <AddManualWarehouseOrderDialog onSuccess={() => mutateWarehouse()} />
         </CardContent>
       </Card>

       <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-4 gap-1 p-1">
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
          <TabsTrigger value="warehouse" className="text-xs px-2 py-1">
            <span className="hidden sm:inline">Склад</span>
            <span className="sm:hidden">Склад</span>
            <Badge variant="secondary" className="ml-1 text-xs">{warehouseOrders.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs px-2 py-1">
            Все заказы
            <Badge variant="secondary" className="ml-1 text-xs">{filteredOrders.length}</Badge>
          </TabsTrigger>
        </TabsList>
        <TabsContent value="production">
            <OrderTable 
                orders={ordersForProduction} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                isLoading={isLoading}
            />
        </TabsContent>
        <TabsContent value="shipment">
             <OrderTable 
                orders={ordersForShipment} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                isLoading={isLoading}
            />
        </TabsContent>
        <TabsContent value="warehouse">
             <OrderTable 
                orders={warehouseOrders} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                isLoading={isLoading}
                onUseFromWarehouse={handleUseFromWarehouse}
                showWarehouseActions={true}
            />
        </TabsContent>
        <TabsContent value="all">
             <OrderTable 
                orders={filteredOrders} 
                currentUser={currentUser} 
                onUpdateStatus={onUpdateStatus}
                isLoading={isLoading}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}
