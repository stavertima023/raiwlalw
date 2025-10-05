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
import { Eye, Package, TrendingUp, Calculator, RefreshCw, CalendarRange } from 'lucide-react';
import type { Payout, PayoutStatus, User, PayoutWithOrders } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

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
  const entries = Object.entries(stats).sort((a, b) => b[1] - a[1]); // Сортируем по убыванию количества
  
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {entries.map(([type, count]) => (
          <div key={type} className="flex justify-between items-center p-2 border rounded">
            <span className="font-medium">{type.toUpperCase()}</span>
            <Badge variant="secondary" className="text-sm">
              {count} шт.
            </Badge>
          </div>
        ))}
      </div>
      {entries.length > 0 && (
        <div className="text-sm text-muted-foreground mt-2">
          Всего типов товаров: {entries.length}
        </div>
      )}
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
      <DialogContent className="max-w-2xl" aria-describedby="payout-details-description">
        <DialogHeader>
          <DialogTitle>Детали выплаты</DialogTitle>
        </DialogHeader>
        <div id="payout-details-description" className="sr-only">
          Подробная информация о выплате включая заказы, статистику по типам товаров и суммы
        </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Статистика по типам товаров
                </CardTitle>
              </CardHeader>
              <CardContent>
                {payout.productTypeStats && Object.keys(payout.productTypeStats).length > 0 ? (
                  <>
                    <ProductTypeStats stats={payout.productTypeStats} />
                    <p className="text-xs text-muted-foreground mt-2">
                      * Статистика рассчитана на основе номеров заказов в выплате
                    </p>
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">Статистика не рассчитана</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Для получения статистики нужно обновить этот вывод через кнопку миграции
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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

            {/* Номера заказов с суммами */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Номера заказов{payout.orders && payout.orders.length > 0 ? ' с суммами' : ''}</CardTitle>
              </CardHeader>
              <CardContent>
                {payout.orders && payout.orders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {payout.orderNumbers.map((orderNumber) => {
                      // Найти заказ в списке orders для получения суммы
                      const order = payout.orders?.find(o => o.orderNumber === orderNumber);
                      return (
                        <div key={orderNumber} className="flex justify-between items-center p-2 border rounded">
                          <Badge variant="outline">
                            #{orderNumber}
                          </Badge>
                          {order && (
                            <span className="text-sm font-medium">
                              {order.price.toLocaleString('ru-RU')} ₽
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {payout.orderNumbers.map((orderNumber) => (
                      <Badge key={orderNumber} variant="outline">
                        #{orderNumber}
                      </Badge>
                    ))}
                    <p className="w-full text-xs text-muted-foreground mt-2">
                      Для отображения сумм заказов выполните миграцию через кнопку "Обновить выводы"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Статистика по типам с х, ф, ш, л */}
            {payout.productTypeStats && Object.keys(payout.productTypeStats).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Анализ типов товаров</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Общая статистика */}
                    <ProductTypeStats stats={payout.productTypeStats} />
                    
                    {/* Специальные типы */}
                    {(() => {
                      const specialTypes = ['х', 'ф', 'ш', 'л'];
                      const specialCounts = specialTypes.map(letter => ({
                        letter,
                        count: Object.entries(payout.productTypeStats)
                          .filter(([type]) => type.toLowerCase().startsWith(letter))
                          .reduce((sum, [, count]) => sum + count, 0)
                      })).filter(item => item.count > 0);
                      
                      const totalSpecial = specialCounts.reduce((sum, item) => sum + item.count, 0);
                      
                      return totalSpecial > 0 ? (
                        <div className="border-t pt-4">
                          <h4 className="font-medium mb-2">Заказы на х, ф, ш, л:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {specialCounts.map(({ letter, count }) => (
                              <div key={letter} className="text-center p-2 bg-slate-700 text-white rounded border border-slate-600">
                                <div className="font-bold text-lg">{count}</div>
                                <div className="text-sm text-slate-300">на "{letter}"</div>
                              </div>
                            ))}
                          </div>
                          <div className="text-center mt-2 p-2 bg-slate-800 text-white rounded border border-slate-700">
                            <div className="font-bold">Всего: {totalSpecial} заказов</div>
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
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
  const { toast } = useToast();
  const [reportOpen, setReportOpen] = React.useState(false);
  const [reportDate, setReportDate] = React.useState<string>('');
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

  // ==== Report (per day) calculations ====
  const reportData = React.useMemo(() => {
    if (!reportDate) {
      return null;
    }

    const target = new Date(reportDate);
    const start = new Date(target);
    start.setHours(0, 0, 0, 0);
    const end = new Date(target);
    end.setHours(23, 59, 59, 999);

    const payoutsOfDay = allPayouts
      .filter(p => {
        const d = new Date(p.date);
        return d >= start && d <= end;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const totalAmount = payoutsOfDay.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOrders = payoutsOfDay.reduce(
      (sum, p) => sum + (p.orderCount || p.orderNumbers?.length || 0),
      0
    );
    const averageCheck = totalOrders > 0 ? totalAmount / totalOrders : 0;

    // Aggregate product types using available stats, fallback to orders
    const productTypeStats: Record<string, number> = {};
    for (const p of payoutsOfDay) {
      if (p.productTypeStats && Object.keys(p.productTypeStats).length > 0) {
        for (const [type, count] of Object.entries(p.productTypeStats)) {
          productTypeStats[type] = (productTypeStats[type] || 0) + (count || 0);
        }
      } else if (p.orders && p.orders.length > 0) {
        for (const o of p.orders) {
          const key = (o.productType || '').toLowerCase();
          if (!key) continue;
          productTypeStats[key] = (productTypeStats[key] || 0) + 1;
        }
      }
    }

    // Build flat orders list (sorted by payout date asc)
    type FlatOrder = {
      payoutId: string;
      payoutDate: Date;
      orderNumber: string;
      price?: number;
      productType?: string;
      size?: string;
      seller?: string;
    };
    const orders: FlatOrder[] = [];
    for (const p of payoutsOfDay) {
      if (p.orders && p.orders.length > 0) {
        for (const o of p.orders) {
          orders.push({
            payoutId: p.id!,
            payoutDate: new Date(p.date),
            orderNumber: o.orderNumber,
            price: o.price,
            productType: o.productType,
            size: o.size,
            seller: o.seller,
          });
        }
      } else if (p.orderNumbers && p.orderNumbers.length > 0) {
        for (const num of p.orderNumbers) {
          orders.push({
            payoutId: p.id!,
            payoutDate: new Date(p.date),
            orderNumber: num,
          });
        }
      }
    }

    // Sort already by payoutDate asc (built that way), keep stable orderNumbers order

    return {
      date: start,
      payouts: payoutsOfDay,
      totalAmount,
      totalOrders,
      averageCheck,
      productTypeStats,
      orders,
    };
  }, [reportDate, allPayouts]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Выводы продавцов</h1>
          <p className="text-muted-foreground">
            Управление выплатами и выводами средств с подробной статистикой
          </p>
        </div>
        <div className="flex gap-2">
          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <CalendarRange className="h-4 w-4 mr-2" />
                Отчет
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Отчет по выводам за день</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-muted-foreground">Дата:</label>
                  <input
                    type="date"
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="flex h-9 w-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                </div>

                {reportData ? (
                  <div className="space-y-4">
                    {/* Summary */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Общая сумма</CardTitle>
                        </CardHeader>
                        <CardContent className="text-lg font-bold">
                          {reportData.totalAmount.toLocaleString('ru-RU')} ₽
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Средний чек</CardTitle>
                        </CardHeader>
                        <CardContent className="text-lg font-bold">
                          {reportData.averageCheck.toFixed(0)} ₽
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Кол-во заказов</CardTitle>
                        </CardHeader>
                        <CardContent className="text-lg font-bold">
                          {reportData.totalOrders}
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Выводов за день</CardTitle>
                        </CardHeader>
                        <CardContent className="text-lg font-bold">
                          {reportData.payouts.length}
                        </CardContent>
                      </Card>
                    </div>

                    {/* Product types */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center">
                          <Package className="h-4 w-4 mr-2" />
                          Количество по типам
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {Object.keys(reportData.productTypeStats).length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {Object.entries(reportData.productTypeStats)
                              .sort((a, b) => b[1] - a[1])
                              .map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center p-2 border rounded">
                                  <span className="font-medium">{type.toUpperCase()}</span>
                                  <Badge variant="secondary">{count} шт.</Badge>
                                </div>
                              ))}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">Нет данных по типам</div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Orders list */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Список заказов (по времени добавления в выводы)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        {reportData.orders.length > 0 ? (
                          <ScrollArea className="h-[320px]">
                            <div className="space-y-2 pr-2">
                              {reportData.orders.map((o, idx) => (
                                <div key={`${o.payoutId}-${o.orderNumber}-${idx}`} className="flex justify-between items-center p-2 border rounded">
                                  <div>
                                    <div className="font-medium">#{o.orderNumber}</div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(o.payoutDate, 'dd.MM.yyyy HH:mm', { locale: ru })}
                                    </div>
                                  </div>
                                  <div className="text-right text-sm">
                                    {o.price != null ? (
                                      <div className="font-medium">{o.price.toLocaleString('ru-RU')} ₽</div>
                                    ) : (
                                      <div className="text-muted-foreground">—</div>
                                    )}
                                    {(o.productType || o.size) && (
                                      <div className="text-xs text-muted-foreground">{o.productType} {o.size}</div>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </ScrollArea>
                        ) : (
                          <div className="text-sm text-muted-foreground">Заказы не найдены</div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Выберите дату, чтобы увидеть отчет.</div>
                )}
              </div>
            </DialogContent>
          </Dialog>
          {onRefresh && (
            <Button onClick={onRefresh} variant="default" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Обновление...' : 'Обновить данные'}
            </Button>
          )}
        </div>
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
                          <span className="font-medium">{payout.orderCount || payout.orderNumbers?.length || 0} шт.</span>
                          <span className="text-xs text-muted-foreground">
                            {payout.orderNumbers?.slice(0, 3).join(', ') || '-'}
                            {payout.orderNumbers && payout.orderNumbers.length > 3 && '...'}
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
                        {payout.productTypeStats && Object.keys(payout.productTypeStats).length > 0 ? (
                          <div className="space-y-1">
                            {Object.entries(payout.productTypeStats)
                              .sort((a, b) => b[1] - a[1])
                              .slice(0, 3)
                              .map(([type, count]) => (
                                <div key={type} className="flex justify-between items-center text-xs">
                                  <span className="font-medium">{type.toUpperCase()}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {count}
                                  </Badge>
                                </div>
                              ))}
                            {Object.keys(payout.productTypeStats).length > 3 && (
                              <div className="text-xs text-muted-foreground">
                                +{Object.keys(payout.productTypeStats).length - 3} еще
                              </div>
                            )}
                          </div>
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