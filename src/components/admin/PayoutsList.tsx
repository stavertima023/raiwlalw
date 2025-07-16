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
import type { Payout, PayoutStatus, User } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface PayoutsListProps {
  allPayouts: Payout[];
  allUsers: User[];
  onUpdateStatus: (payoutId: string, newStatus: PayoutStatus) => void;
  currentUser: Omit<User, 'password_hash'>;
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

export const PayoutsList: React.FC<PayoutsListProps> = ({ 
  allPayouts, 
  allUsers, 
  onUpdateStatus,
  currentUser 
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
    <Card>
      <CardHeader>
        <CardTitle>Выводы продавцов</CardTitle>
        <CardDescription>
          Управление выплатами и выводами средств
        </CardDescription>
        
        {/* Filters */}
        <div className="flex gap-4 mt-4">
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
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="mobile-table-container scrollbar-thin border-t">
          <div className="overflow-x-auto">
            <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Продавец</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Заказов</TableHead>
                <TableHead>Статус</TableHead>
                <TableHead>Обработал</TableHead>
                <TableHead>Комментарий</TableHead>
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
                          {payout.orderNumbers.slice(0, 2).join(', ')}
                          {payout.orderNumbers.length > 2 && '...'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payout.status} />
                    </TableCell>
                    <TableCell>
                      {sellerMap[payout.processedBy] || payout.processedBy}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {payout.comment || '–'}
                    </TableCell>
                    <TableCell>
                      {payout.status === 'pending' && (
                        <div className="flex gap-1">
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
                        </div>
                      )}
                      {payout.status === 'processing' && (
                        <div className="flex gap-1">
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
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    Выводы не найдены.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 