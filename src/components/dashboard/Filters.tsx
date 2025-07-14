
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
import { OrderStatus, OrderStatusEnum, ProductType, ProductTypeEnum } from '@/lib/types';
import { Input } from '../ui/input';

interface FiltersProps {
  onFilterChange: (filters: {
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
    orderNumber: string;
  }) => void;
  currentFilters: {
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
    orderNumber: string;
  };
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange, currentFilters }) => {
  const [status, setStatus] = React.useState<OrderStatus | 'all'>(currentFilters.status);
  const [productType, setProductType] = React.useState<ProductType | 'all'>(currentFilters.productType);
  const [orderNumber, setOrderNumber] = React.useState(currentFilters.orderNumber);

  React.useEffect(() => {
    setStatus(currentFilters.status);
    setProductType(currentFilters.productType);
    setOrderNumber(currentFilters.orderNumber);
  }, [currentFilters]);
  
  React.useEffect(() => {
    // Debounce filter changes
    const handler = setTimeout(() => {
      onFilterChange({ status, productType, orderNumber });
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [status, productType, orderNumber, onFilterChange]);


  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            placeholder="Поиск по номеру заказа..."
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
          />
          <Select
            value={status}
            onValueChange={(value) => setStatus(value as OrderStatus | 'all')}
          >
            <SelectTrigger className="w-full">
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
            <SelectTrigger className="w-full">
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
        </div>
      </CardContent>
    </Card>
  );
};

export default Filters;
