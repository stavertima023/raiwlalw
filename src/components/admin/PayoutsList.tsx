'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Eye, Package, TrendingUp, Calculator, RefreshCw } from 'lucide-react';
import type { Payout, PayoutStatus, User, PayoutWithOrders } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LoadingIndicator } from '@/components/ui/loading-indicator';

interface PayoutsListProps {
  allPayouts: PayoutWithOrders[];
  allUsers: User[];
  onUpdateStatus: (payoutId: string, newStatus: PayoutStatus) => void;
  currentUser: Omit<User, 'password_hash'>;
  onRefresh?: () => void;
  isLoading?: boolean;
}

const statusConfig: Record<
  PayoutStatus,
  { label: string; color: 'default' | 'secondary' | 'destructive' | 'outline' }
> = {
  pending: { label: 'Ожидает', color: 'outline' },
  processing: { label: 'Обрабатывается', color: 'secondary' },
  completed: { label: 'Завершен', color: 'default' },
  cancelled: { label: 'Отменен', color: 'destructive' },
};

const StatusBadge: React.FC<{ status: PayoutStatus }> = ({ status }) => {
  const { label, color } = statusConfig[status] || { label: status, color: 'default' };
  return (
    <Badge variant={color} className="capitalize whitespace-nowrap">
      {label}
    </Badge>
  );
};

// Компонент для отображения статистики по типам товаров
const ProductTypeStats: React.FC<{ stats: Record<string, number> }> = ({ stats }) => {
  const entries = Object.entries(stats);
  
  return (
    <div className="flex flex-wrap gap-1">
      {entries.map(([type, count]) => (
        <Badge key={type} variant="secondary" className="text-xs">
          {type}: {count}
        </Badge>
      ))}
    </div>
  );
};

// Компонент для отображения подробной информации о выплате
const PayoutDetailsDialog: React.FC<{ payout: PayoutWithOrders; sellerMap: Record<string, string> }> = ({ 
  payout, 
  sellerMap 
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Eye className="h-4 w-4 mr-1" />
          Детали
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Детали выплаты</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[400px]">
          <div className="space-y-4">
            {/* Основная информация */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Основная информация</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Продавец:</span>
                    <p className="font-medium">{sellerMap[payout.seller] || payout.seller}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Дата:</span>
                    <p className="font-medium">{format(payout.date, 'd MMM yyyy HH:mm', { locale: ru })}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Общая сумма:</span>
                    <p className="font-medium text-lg">{payout.amount.toLocaleString('ru-RU')} ₽</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">Количество заказов:</span>
                    <p className="font-medium">{payout.orderCount} шт.</p>
                  </div>
                  {payout.averageCheck && (
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">Средний чек:</span>
                      <p className="font-medium">{payout.averageCheck.toLocaleString('ru-RU')} ₽</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Статистика по типам товаров */}
            {payout.productTypeStats && Object.keys(payout.productTypeStats).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Package className="h-4 w-4 mr-2" />
                    Статистика по типам товаров
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductTypeStats stats={payout.productTypeStats} />
                </CardContent>
              </Card>
            )}

            {/* Список заказов */}
            {payout.orders && payout.orders.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Заказы в выплате</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {payout.orders.map((order) => (
                      <div key={order.id} className="flex justify-between items-center p-2 border rounded">
                        <div>
                          <p className="font-medium">#{order.orderNumber}</p>
                          <p className="text-sm text-muted-foreground">
                            {order.productType} - {order.size}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{order.price.toLocaleString('ru-RU')} ₽</p>
                          <p className="text-sm text-muted-foreground">{order.status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Номера заказов */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Номера заказов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {payout.orderNumbers.map((orderNumber) => (
                    <Badge key={orderNumber} variant="outline">
                      #{orderNumber}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export const PayoutsList: React.FC<PayoutsListProps> = ({ 
  allPayouts, 
  allUsers, 
  onUpdateStatus,
  currentUser,
  onRefresh,
  isLoading = false
}) => {
  const [filters, setFilters] = React.useState({
    status: 'all' as PayoutStatus | 'all',
    seller: 'all' as string | 'all',
  });

  const sellerMap = React.useMemo(() => {
    return allUsers.reduce((acc, user) => {
      acc[user.username] = user.name;
      return acc;
    }, {} as Record<string, string>);
  }, [allUsers]);

  const filteredPayouts = React.useMemo(() => {
    let filtered = [...allPayouts];

    if (filters.status !== 'all') {
      filtered = filtered.filter(payout => payout.status === filters.status);
    }
    if (filters.seller !== 'all') {
      filtered = filtered.filter(payout => payout.seller === filters.seller);
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [allPayouts, filters]);

  const sellerUsers = allUsers.filter(u => u.role === 'Продавец');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Выводы продавцов</h1>
          <p className="text-muted-foreground">
            Управление выплатами и выводами средств с подробной статистикой
          </p>
        </div>
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        )}
      </div>

      {/* Индикатор загрузки */}
      <LoadingIndicator 
        isLoading={isLoading}
        dataCount={allPayouts.length}
        dataType="выплат"
        showCacheStatus={true}
      />

      {/* Фильтры */}
      <Card>
        <CardHeader>
          <CardTitle>Фильтры</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value as PayoutStatus | 'all' }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Фильтр по статусу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидает</SelectItem>
                <SelectItem value="processing">Обрабатывается</SelectItem>
                <SelectItem value="completed">Завершен</SelectItem>
                <SelectItem value="cancelled">Отменен</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.seller}
              onValueChange={(value) => setFilters(prev => ({ ...prev, seller: value }))}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Фильтр по продавцу" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все продавцы</SelectItem>
                {sellerUsers.map((user) => (
                  <SelectItem key={user.username} value={user.username}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Таблица выплат */}
      <Card>
        <CardHeader>
          <CardTitle>Список выплат</CardTitle>
          <CardDescription>
            Подробная информация о всех выплатах с статистикой
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Дата</TableHead>
                  <TableHead>Продавец</TableHead>
                  <TableHead>Сумма</TableHead>
                  <TableHead>Заказов</TableHead>
                  <TableHead>Средний чек</TableHead>
                  <TableHead>Типы товаров</TableHead>
                  <TableHead>Статус</TableHead>
                  <TableHead>Обработал</TableHead>
                  <TableHead>Действия</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayouts.length > 0 ? (
                  filteredPayouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium">
                        {format(payout.date, 'd MMM yyyy HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell>
                        {sellerMap[payout.seller] || payout.seller}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {payout.amount.toLocaleString('ru-RU')} ₽
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{payout.orderCount} шт.</span>
                          <span className="text-xs text-muted-foreground">
                            {payout.orderNumbers.slice(0, 3).join(', ')}
                            {payout.orderNumbers.length > 3 && '...'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {payout.averageCheck ? (
                          <span className="font-medium">
                            {payout.averageCheck.toLocaleString('ru-RU')} ₽
                          </span>
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {payout.productTypeStats ? (
                          <ProductTypeStats stats={payout.productTypeStats} />
                        ) : (
                          <span className="text-muted-foreground">–</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={payout.status} />
                      </TableCell>
                      <TableCell>
                        {sellerMap[payout.processedBy] || payout.processedBy}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <PayoutDetailsDialog payout={payout} sellerMap={sellerMap} />
                          
                          {payout.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onUpdateStatus(payout.id!, 'processing')}
                              >
                                Обработать
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onUpdateStatus(payout.id!, 'cancelled')}
                              >
                                Отменить
                              </Button>
                            </>
                          )}
                          {payout.status === 'processing' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => onUpdateStatus(payout.id!, 'completed')}
                              >
                                Завершить
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => onUpdateStatus(payout.id!, 'cancelled')}
                              >
                                Отменить
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      Выводы не найдены.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 