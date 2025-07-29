
'use client';

import React, { useState, useMemo } from 'react';
import { Order, User } from '@/lib/types';
import { OrderTable } from './OrderTable';
import { AddOrderDialog } from './AddOrderDialog';
import { LoadingIndicator } from '@/components/ui/loading-indicator';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { Plus } from 'lucide-react';

interface DashboardProps {
  currentUser: User;
  orders: Order[];
  isLoading?: boolean;
  onAddOrder: (order: Omit<Order, 'id'>) => void;
  onUpdateStatus?: (orderId: string, newStatus: string) => void;
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

export function Dashboard({
  currentUser,
  orders,
  isLoading = false,
  onAddOrder,
  onUpdateStatus,
  pagination,
  onPageChange
}: DashboardProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Фильтрация заказов по поисковому запросу
  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders;
    
    const term = searchTerm.toLowerCase();
    return orders.filter(order => 
      order.orderNumber.toLowerCase().includes(term) ||
      order.seller.toLowerCase().includes(term) ||
      order.productType.toLowerCase().includes(term)
    );
  }, [orders, searchTerm]);

  const handleCreatePayout = () => {
    // Логика создания выплаты
    console.log('Создание выплаты для продавца:', currentUser.username);
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и кнопки */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Заказы</h1>
          <p className="text-muted-foreground">
            Управление заказами для {currentUser.username}
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          {/* Поиск */}
          <input
            type="text"
            placeholder="Поиск по номеру заказа, продавцу..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-2 border rounded-md text-sm"
          />
          
          {/* Кнопки действий */}
          <div className="flex gap-2">
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2"
              variant="success"
            >
              <Plus className="h-4 w-4" />
              Добавить заказ
            </Button>
            
            {currentUser.role === 'Продавец' && (
              <Button
                onClick={handleCreatePayout}
                variant="outline"
                className="flex items-center gap-2"
              >
                Создать выплату
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Индикатор загрузки */}
      <LoadingIndicator isLoading={isLoading} />

      {/* Таблица заказов */}
      <OrderTable
        orders={filteredOrders}
        currentUser={currentUser}
        onUpdateStatus={onUpdateStatus}
        isLoading={isLoading}
      />

      {/* Пагинация */}
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

      {/* Диалог добавления заказа */}
      <AddOrderDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSubmit={onAddOrder}
        currentUser={currentUser}
      />
    </div>
  );
}
