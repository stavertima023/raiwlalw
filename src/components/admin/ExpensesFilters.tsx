
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ExpenseCategory, ExpenseCategoryEnum, User } from '@/lib/types';

interface ExpensesFiltersProps {
  onFilterChange: (filters: {
    category: ExpenseCategory | 'all';
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  currentFilters: {
    category: ExpenseCategory | 'all';
    dateFrom?: string;
    dateTo?: string;
  };
  onClear: () => void;
}

export const ExpensesFilters: React.FC<ExpensesFiltersProps> = ({
  onFilterChange,
  currentFilters,
  onClear
}: ExpensesFiltersProps) => {
  const [category, setCategory] = React.useState<ExpenseCategory | 'all'>(currentFilters.category);
  const [dateFrom, setDateFrom] = React.useState<string>(currentFilters.dateFrom || '');
  const [dateTo, setDateTo] = React.useState<string>(currentFilters.dateTo || '');

  React.useEffect(() => {
    onFilterChange({ category, dateFrom, dateTo });
  }, [category, dateFrom, dateTo]);
  
  const handleClear = () => {
    setCategory('all');
    setDateFrom('');
    setDateTo('');
    onClear();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div>
            <Label htmlFor="date-from">Дата от</Label>
            <Input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="date-to">Дата до</Label>
            <Input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>

          <Select
            value={category}
            onValueChange={(value: string) => setCategory(value as ExpenseCategory | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {ExpenseCategoryEnum.options.map((cat: ExpenseCategory) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="ghost" onClick={handleClear} className="w-full lg:w-auto">Очистить фильтры</Button>
        </div>
      </CardContent>
    </Card>
  );
};
