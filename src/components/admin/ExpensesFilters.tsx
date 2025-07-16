
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
import { ExpenseCategory, ExpenseCategoryEnum } from '@/lib/types';

interface ExpensesFiltersProps {
  onFilterChange: (filters: {
    category: ExpenseCategory | 'all';
    responsible: string | 'all';
    dateFrom?: string;
    dateTo?: string;
  }) => void;
  currentFilters: {
    category: ExpenseCategory | 'all';
    responsible: string | 'all';
    dateFrom?: string;
    dateTo?: string;
  };
  onClear: () => void;
  allUsers: { username: string; name: string }[];
}

export const ExpensesFilters: React.FC<ExpensesFiltersProps> = ({
  onFilterChange,
  currentFilters,
  onClear,
  allUsers
}: ExpensesFiltersProps) => {
  // Use controlled components that update filters immediately
  const handleCategoryChange = (value: string) => {
    onFilterChange({ 
      ...currentFilters,
      category: value as ExpenseCategory | 'all'
    });
  };

  const handleResponsibleChange = (value: string) => {
    onFilterChange({ 
      ...currentFilters,
      responsible: value
    });
  };

  const handleDateFromChange = (value: string) => {
    onFilterChange({ 
      ...currentFilters,
      dateFrom: value || undefined
    });
  };

  const handleDateToChange = (value: string) => {
    onFilterChange({ 
      ...currentFilters,
      dateTo: value || undefined
    });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
          {/* Date From Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Дата с</label>
            <Input
              type="date"
              value={currentFilters.dateFrom || ''}
              onChange={(e) => handleDateFromChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Date To Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Дата по</label>
            <Input
              type="date"
              value={currentFilters.dateTo || ''}
              onChange={(e) => handleDateToChange(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Категория</label>
            <Select
              value={currentFilters.category}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все категории" />
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
          </div>

          {/* Responsible Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Ответственный</label>
            <Select
              value={currentFilters.responsible}
              onValueChange={handleResponsibleChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Все пользователи" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все пользователи</SelectItem>
                {allUsers.map((user) => (
                  <SelectItem key={user.username} value={user.username}>
                    {user.name} ({user.username})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Clear Filters Button */}
          <div className="space-y-2">
            <label className="text-sm font-medium invisible">Действия</label>
            <Button variant="outline" onClick={onClear} className="w-full">
              Очистить фильтры
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
