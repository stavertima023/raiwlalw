
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
    responsible: string | 'all';
  }) => void;
  currentFilters: {
    category: ExpenseCategory | 'all';
    responsible: string | 'all';
  };
  allUsers: User[];
  onClear: () => void;
}

export const ExpensesFilters: React.FC<ExpensesFiltersProps> = ({
  onFilterChange,
  currentFilters,
  allUsers,
  onClear
}) => {
  const [category, setCategory] = React.useState<ExpenseCategory | 'all'>(currentFilters.category);
  const [responsible, setResponsible] = React.useState<string | 'all'>(currentFilters.responsible);

  React.useEffect(() => {
    onFilterChange({ category, responsible });
  }, [category, responsible, onFilterChange]);
  
  const handleClear = () => {
    setCategory('all');
    setResponsible('all');
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
            onValueChange={(value) => setCategory(value as ExpenseCategory | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по категории" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {ExpenseCategoryEnum.options.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={responsible}
            onValueChange={(value) => setResponsible(value as string | 'all')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Фильтр по ответственному" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все ответственные</SelectItem>
              {allUsers.map((user) => (
                <SelectItem key={user.telegramId} value={user.telegramId}>
                  {user.name}
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
