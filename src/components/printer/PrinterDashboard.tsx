
'use client';

import * as React from 'react';
import type { Order, User, OrderStatus, ProductType } from '@/lib/types';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, AlertCircle, CheckCircle, Send, Check, X } from 'lucide-react';
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
}>(({ orders, currentUser, onUpdateStatus, isLoading, title, description }) => {
  const { toast } = useToast();
  const [error, setError] = React.useState<string | null>(null);

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
              
              {/* Фото заказа */}
              {order.photos && order.photos.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {order.photos.map((photo, index) => (
                    <Dialog key={index}>
                      <DialogTrigger asChild>
                        <div className="relative flex-shrink-0 cursor-pointer group">
                          <img
                            src={photo}
                            alt={`Фото ${index + 1}`}
                            className="w-16 h-16 object-cover rounded-md border transition-transform group-hover:scale-105"
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

  // Стабилизированная фильтрация с защитой от ошибок
  const filteredOrders = React.useMemo(() => {
    try {
    return allOrders.filter(order => {
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
        const orderNumberMatch = filters.orderNumber === '' || 
          order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
      return statusMatch && productTypeMatch && orderNumberMatch;
    });
    } catch (err) {
      console.error('Ошибка фильтрации заказов:', err);
      setError('Ошибка при фильтрации заказов');
      return [];
    }
  }, [allOrders, filters]);

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

        {/* Мобильные вкладки */}
        <Tabs defaultValue="production" className="w-full">
          <TabsList className="grid w-full grid-cols-3 gap-1 p-1">
            <TabsTrigger value="production" className="text-xs px-2 py-1">
              Изготовление
              <Badge variant="secondary" className="ml-1 text-xs">{ordersForProduction.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="shipment" className="text-xs px-2 py-1">
              Отправка
              <Badge variant="secondary" className="ml-1 text-xs">{ordersForShipment.length}</Badge>
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

  // Десктопная версия - стандартная
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
      
       <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 p-1">
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
