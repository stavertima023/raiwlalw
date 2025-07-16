
'use client';

import * as React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { OrderStatus, OrderStatusEnum, ProductType, ProductTypeEnum, User } from '@/lib/types';
import { Input } from '../ui/input';

interface AdminOrderFiltersProps {
  onFilterChange: (filters: {
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
    seller: string | 'all';
    orderNumber: string;
  }) => void;
  currentFilters: {
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
    seller: string | 'all';
    orderNumber: string;
  };
  allUsers: User[];
}

const AdminOrderFilters: React.FC<AdminOrderFiltersProps> = ({ onFilterChange, currentFilters, allUsers }) => {
  const [status, setStatus] = React.useState<OrderStatus | 'all'>(currentFilters.status);
  const [productType, setProductType] = React.useState<ProductType | 'all'>(currentFilters.productType);
  const [seller, setSeller] = React.useState<string | 'all'>(currentFilters.seller);
  const [orderNumber, setOrderNumber] = React.useState(currentFilters.orderNumber);

  React.useEffect(() => {
    setStatus(currentFilters.status);
    setProductType(currentFilters.productType);
    setSeller(currentFilters.seller);
    setOrderNumber(currentFilters.orderNumber);
  }, [currentFilters]);
  
  React.useEffect(() => {
    // Debounce filter changes to avoid excessive re-renders
    const handler = setTimeout(() => {
      onFilterChange({ status, productType, seller, orderNumber });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [status, productType, seller, orderNumber, onFilterChange]);
  
  const sellerUsers = allUsers.filter(u => u.role === 'Продавец');

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Поиск по номеру заказа..."
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as OrderStatus | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по статусу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все статусы</SelectItem>
              {OrderStatusEnum.options.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={productType}
            onValueChange={(value) => setProductType(value as ProductType | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по типу изделия" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все типы</SelectItem>
              {ProductTypeEnum.options.map((pt) => (
                <SelectItem key={pt} value={pt}>
                  {pt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
           <Select
            value={seller}
            onValueChange={(value) => setSeller(value as string | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по продавцу" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все продавцы</SelectItem>
              {sellerUsers.map((u) => (
                <SelectItem key={u.username} value={u.username}>
                  {u.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminOrderFilters;
