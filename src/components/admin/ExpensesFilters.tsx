
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
import { ExpenseCategory, ExpenseCategoryEnum, User } from '@/lib/types';

interface ExpensesFiltersProps {
  onFilterChange: (filters: {
    category: ExpenseCategory | 'all';
  }) => void;
  currentFilters: {
    category: ExpenseCategory | 'all';
  };
  onClear: () => void;
}

export const ExpensesFilters: React.FC<ExpensesFiltersProps> = ({
  onFilterChange,
  currentFilters,
  onClear
}: ExpensesFiltersProps) => {
  const [category, setCategory] = React.useState<ExpenseCategory | 'all'>(currentFilters.category);

  React.useEffect(() => {
    onFilterChange({ category });
  }, [category, onFilterChange]);
  
  const handleClear = () => {
    setCategory('all');
    onClear();
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* Placeholder for Date Range Picker */}
          <div className="p-2 h-10 flex items-center justify-center border rounded-md text-sm text-muted-foreground">
              Фильтр по дате (в разработке)
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
