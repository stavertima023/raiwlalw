
'use client';

import * as React from 'react';
import type { Order, User, OrderStatus, ProductType } from '@/lib/types';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from '@/components/ui/badge';
import Filters from '@/components/dashboard/Filters';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PrinterDashboardProps {
  currentUser: User;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  allOrders: Order[];
  isLoading?: boolean;
}

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

  // Мемоизируем фильтрацию для производительности
  const filteredOrders = React.useMemo(() => {
    if (!allOrders || allOrders.length === 0) return [];
    
    return allOrders.filter(order => {
      const statusMatch = filters.status === 'all' || order.status === filters.status;
      const productTypeMatch = filters.productType === 'all' || order.productType === filters.productType;
      const orderNumberMatch = filters.orderNumber === '' || 
        order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase());
      return statusMatch && productTypeMatch && orderNumberMatch;
    });
  }, [allOrders, filters]);

  // Мемоизируем заказы для производства
  const ordersForProduction = React.useMemo(() => {
    return filteredOrders.filter(order => order.status === 'Добавлен');
  }, [filteredOrders]);
  
  // Мемоизируем заказы для отправки с сортировкой
  const ordersForShipment = React.useMemo(() => {
    return filteredOrders
      .filter(order => order.status === 'Готов')
      .sort((a, b) => {
        // Сортировка по времени готовности (сначала самые новые)
        if (!a.ready_at && !b.ready_at) return 0;
        if (!a.ready_at) return 1;
        if (!b.ready_at) return -1;
        return new Date(b.ready_at).getTime() - new Date(a.ready_at).getTime();
      });
  }, [filteredOrders]);

  // Обработчик ошибок
  const [hasError, setHasError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');

  React.useEffect(() => {
    if (allOrders.length === 0 && !isLoading) {
      setHasError(true);
      setErrorMessage('Не удалось загрузить заказы. Проверьте подключение к интернету.');
    } else {
      setHasError(false);
      setErrorMessage('');
    }
  }, [allOrders.length, isLoading]);

  const handleRefresh = () => {
    setHasError(false);
    setErrorMessage('');
    // Здесь можно добавить принудительное обновление данных
    window.location.reload();
  };

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

      {/* Обработка ошибок */}
      {hasError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              className="ml-2"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Обновить
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Фильтры */}
      <Filters onFilterChange={setFilters} currentFilters={filters} />
      
      {/* Вкладки с заказами */}
      <Tabs defaultValue="production" className="w-full">
        <TabsList className="grid w-full grid-cols-3 gap-1 p-1">
          <TabsTrigger value="production" className="text-xs px-2 py-1">
            <span className="hidden sm:inline">На изготовление</span>
            <span className="sm:hidden">Изготовление</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {ordersForProduction.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="shipment" className="text-xs px-2 py-1">
            <span className="hidden sm:inline">На отправку</span>
            <span className="sm:hidden">Отправка</span>
            <Badge variant="secondary" className="ml-1 text-xs">
              {ordersForShipment.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="text-xs px-2 py-1">
            Все заказы
            <Badge variant="secondary" className="ml-1 text-xs">
              {filteredOrders.length}
            </Badge>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="production" className="mt-4">
          {!isLoading && !hasError && (
            <OrderTable 
              orders={ordersForProduction} 
              currentUser={currentUser} 
              onUpdateStatus={onUpdateStatus}
              isLoading={isLoading}
            />
          )}
          {!isLoading && hasError && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Не удалось загрузить заказы</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="shipment" className="mt-4">
          {!isLoading && !hasError && (
            <OrderTable 
              orders={ordersForShipment} 
              currentUser={currentUser} 
              onUpdateStatus={onUpdateStatus}
              isLoading={isLoading}
            />
          )}
          {!isLoading && hasError && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Не удалось загрузить заказы</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          {!isLoading && !hasError && (
            <OrderTable 
              orders={filteredOrders} 
              currentUser={currentUser} 
              onUpdateStatus={onUpdateStatus}
              isLoading={isLoading}
            />
          )}
          {!isLoading && hasError && (
            <Card>
              <CardContent className="flex items-center justify-center py-8">
                <div className="text-center">
                  <AlertCircle className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Не удалось загрузить заказы</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
