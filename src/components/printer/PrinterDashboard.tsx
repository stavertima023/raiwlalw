
'use client';

import React, { useState, useMemo } from 'react';
import { Order, User, OrderStatus } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Pagination } from '@/components/ui/pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { X } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PrinterDashboardProps {
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  allOrders: Order[];
  isLoading?: boolean;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  onPageChange?: (page: number) => void;
}

// Компонент для мобильного отображения заказов
function MobilePrinterView({ 
  orders, 
  onUpdateStatus, 
  currentUser 
}: { 
  orders: Order[]; 
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  currentUser: User;
}) {
  const handleStatusUpdate = (orderId: string, newStatus: OrderStatus) => {
    onUpdateStatus(orderId, newStatus);
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white rounded-lg border p-4 space-y-3">
          {/* Заголовок заказа */}
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold text-lg">#{order.orderNumber}</h3>
              <p className="text-sm text-gray-500">
                {format(new Date(order.orderDate), 'd MMM yyyy, HH:mm', { locale: ru })}
              </p>
            </div>
            <Badge 
              variant={order.status === 'Исполнен' ? 'success' : order.status === 'Готов' ? 'warning' : 'default'}
              className={order.status === 'Готов' ? 'border-blue-500 text-white bg-transparent' : ''}
            >
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
                Готов
              </Button>
            )}
            {order.status === 'Готов' && (
              <Button
                size="sm"
                onClick={() => handleStatusUpdate(order.id!, 'Исполнен')}
                variant="success"
                className="flex-1"
              >
                Исполнен
              </Button>
            )}
          </div>

          {/* Дата изготовления */}
          {order.status === 'Готов' && order.ready_at && (
            <p className="text-xs text-blue-600">
              Изготовлен: {format(new Date(order.ready_at), 'd MMM yyyy, HH:mm', { locale: ru })}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

export function PrinterDashboard({
  currentUser,
  onUpdateStatus,
  allOrders,
  isLoading = false,
  pagination,
  onPageChange
}: PrinterDashboardProps) {
  const [activeTab, setActiveTab] = useState('ready');

  // Проверяем мобильное устройство
  const checkMobile = () => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  };

  const [isMobile, setIsMobile] = React.useState(checkMobile);

  React.useEffect(() => {
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Фильтрация заказов по статусу
  const ordersForReady = useMemo(() => {
    try {
      return allOrders.filter(order => order.status === 'Добавлен');
    } catch (error) {
      console.error('Ошибка фильтрации заказов для изготовления:', error);
      return [];
    }
  }, [allOrders]);

  const ordersForShipment = useMemo(() => {
    try {
      return allOrders.filter(order => order.status === 'Готов').sort((a, b) => {
        if (a.ready_at && b.ready_at) {
          return new Date(b.ready_at).getTime() - new Date(a.ready_at).getTime();
        }
        return 0;
      });
    } catch (error) {
      console.error('Ошибка фильтрации заказов для отправки:', error);
      return [];
    }
  }, [allOrders]);

  const allOrdersFiltered = useMemo(() => {
    try {
      return allOrders;
    } catch (error) {
      console.error('Ошибка фильтрации всех заказов:', error);
      return [];
    }
  }, [allOrders]);

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Принтовщик</h1>
          <p className="text-muted-foreground">
            Управление заказами для {currentUser.username}
          </p>
        </div>

        <LoadingIndicator isLoading={isLoading} />

        {/* Мобильные вкладки */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ready" className="text-xs">
              На изготовление ({ordersForReady.length})
            </TabsTrigger>
            <TabsTrigger value="shipment" className="text-xs">
              На отправку ({ordersForShipment.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="text-xs">
              Все заказы ({allOrdersFiltered.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ready" className="mt-4">
            <MobilePrinterView 
              orders={ordersForReady} 
              onUpdateStatus={onUpdateStatus}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="shipment" className="mt-4">
            <MobilePrinterView 
              orders={ordersForShipment} 
              onUpdateStatus={onUpdateStatus}
              currentUser={currentUser}
            />
          </TabsContent>

          <TabsContent value="all" className="mt-4">
            <MobilePrinterView 
              orders={allOrdersFiltered} 
              onUpdateStatus={onUpdateStatus}
              currentUser={currentUser}
            />
          </TabsContent>
        </Tabs>

        {/* Пагинация для мобильной версии */}
        {pagination && onPageChange && (
          <Pagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            onPageChange={onPageChange}
            hasNext={pagination.hasNext}
            hasPrev={pagination.hasPrev}
            total={pagination.total}
            limit={pagination.limit}
          />
        )}
      </div>
    );
  }

  // Десктопная версия остается без изменений
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Принтовщик</h1>
        <p className="text-muted-foreground">
          Управление заказами для {currentUser.username}
        </p>
      </div>

      <LoadingIndicator isLoading={isLoading} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="ready">
            На изготовление ({ordersForReady.length})
          </TabsTrigger>
          <TabsTrigger value="shipment">
            На отправку ({ordersForShipment.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Все заказы ({allOrdersFiltered.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="ready" className="mt-6">
          <div className="space-y-4">
            {ordersForReady.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.orderDate), 'd MMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <Badge variant="default">{order.status}</Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                {order.comment && (
                  <div className="mt-4">
                    <span className="text-muted-foreground">Комментарий:</span>
                    <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                      {order.comment}
                    </p>
                  </div>
                )}

                <div className="mt-4">
                  <Button
                    onClick={() => onUpdateStatus(order.id!, 'Готов')}
                    className="w-full"
                  >
                    Готов
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="shipment" className="mt-6">
          <div className="space-y-4">
            {ordersForShipment.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.orderDate), 'd MMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <Badge variant="warning" className="border-blue-500 text-white bg-transparent">
                    {order.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                {order.comment && (
                  <div className="mt-4">
                    <span className="text-muted-foreground">Комментарий:</span>
                    <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                      {order.comment}
                    </p>
                  </div>
                )}

                {order.ready_at && (
                  <p className="text-sm text-blue-600 mt-2">
                    Изготовлен: {format(new Date(order.ready_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </p>
                )}

                <div className="mt-4">
                  <Button
                    onClick={() => onUpdateStatus(order.id!, 'Исполнен')}
                    variant="success"
                    className="w-full"
                  >
                    Исполнен
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="all" className="mt-6">
          <div className="space-y-4">
            {allOrdersFiltered.map((order) => (
              <div key={order.id} className="bg-white rounded-lg border p-4">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-semibold">#{order.orderNumber}</h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(order.orderDate), 'd MMM yyyy, HH:mm', { locale: ru })}
                    </p>
                  </div>
                  <Badge 
                    variant={order.status === 'Исполнен' ? 'success' : order.status === 'Готов' ? 'warning' : 'default'}
                    className={order.status === 'Готов' ? 'border-blue-500 text-white bg-transparent' : ''}
                  >
                    {order.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
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

                {order.comment && (
                  <div className="mt-4">
                    <span className="text-muted-foreground">Комментарий:</span>
                    <p className="mt-1 text-gray-700 bg-gray-50 p-2 rounded">
                      {order.comment}
                    </p>
                  </div>
                )}

                {order.status === 'Готов' && order.ready_at && (
                  <p className="text-sm text-blue-600 mt-2">
                    Изготовлен: {format(new Date(order.ready_at), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </p>
                )}

                {order.status === 'Исполнен' && (
                  <p className="text-sm text-green-600 mt-2">
                    Исполнен
                  </p>
                )}
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Пагинация для десктопной версии */}
      {pagination && onPageChange && (
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={onPageChange}
          hasNext={pagination.hasNext}
          hasPrev={pagination.hasPrev}
          total={pagination.total}
          limit={pagination.limit}
        />
      )}
    </div>
  );
}
