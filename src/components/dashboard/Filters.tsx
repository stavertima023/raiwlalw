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

interface FiltersProps {
  onFilterChange: (filters: {
    status: OrderStatus | 'all';
    productType: ProductType | 'all';
  }) => void;
}

const Filters: React.FC<FiltersProps> = ({ onFilterChange }) => {
  const [status, setStatus] = React.useState<OrderStatus | 'all'>('all');
  const [productType, setProductType] = React.useState<ProductType | 'all'>('all');

  React.useEffect(() => {
    onFilterChange({ status, productType });
  }, [status, productType, onFilterChange]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
