
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import type { Expense, User, ExpenseCategory } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AddExpenseForm } from './AddExpenseForm';
import { ExpensesFilters } from './ExpensesFilters';

interface ExpensesListProps {
  allExpenses: Expense[];
  allUsers: User[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
}

interface ExpenseSortDescriptor {
  column: keyof Expense;
  direction: 'asc' | 'desc';
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ allExpenses, allUsers, onAddExpense }) => {
  const [filters, setFilters] = React.useState({
    category: 'all' as ExpenseCategory | 'all',
    responsible: 'all' as string | 'all',
  });

  const [sortDescriptor, setSortDescriptor] = React.useState<ExpenseSortDescriptor>({
    column: 'date',
    direction: 'desc',
  });

  const handleSort = (column: keyof Expense) => {
    const isAsc = sortDescriptor.column === column && sortDescriptor.direction === 'asc';
    setSortDescriptor({ column, direction: isAsc ? 'desc' : 'asc' });
  };

  const userMap = React.useMemo(() => {
    return allUsers.reduce((acc, user) => {
      acc[user.telegramId] = user.name;
      return acc;
    }, {} as Record<string, string>);
  }, [allUsers]);

  const filteredAndSortedExpenses = React.useMemo(() => {
    let filtered = [...allExpenses];

    if (filters.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === filters.category);
    }
    if (filters.responsible !== 'all') {
      filtered = filtered.filter(expense => expense.responsible === filters.responsible);
    }

    filtered.sort((a, b) => {
      const aValue = a[sortDescriptor.column];
      const bValue = b[sortDescriptor.column];
      
      let cmp = 0;
      if (aValue > bValue) cmp = 1;
      if (aValue < bValue) cmp = -1;

      return sortDescriptor.direction === 'desc' ? -cmp : cmp;
    });

    return filtered;
  }, [allExpenses, filters, sortDescriptor]);

  const renderSortableHeader = (column: keyof Expense, label: string) => (
    <TableHead>
      <Button variant="ghost" onClick={() => handleSort(column)} className="-ml-4">
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Управление расходами</h1>
          <p className="text-muted-foreground">
            Отслеживайте и управляйте всеми расходами компании.
          </p>
        </div>
        <AddExpenseForm onSave={onAddExpense} allUsers={allUsers} currentUser={allUsers.find(u => u.role === "Администратор")!} />
      </div>

      <ExpensesFilters
        onFilterChange={setFilters}
        currentFilters={filters}
        allUsers={allUsers}
        onClear={() => setFilters({ category: 'all', responsible: 'all' })}
      />

      <Card>
        <CardHeader>
          <CardTitle>Список расходов</CardTitle>
          <CardDescription>Все зафиксированные расходы.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                {renderSortableHeader('date', 'Дата')}
                {renderSortableHeader('amount', 'Сумма')}
                {renderSortableHeader('category', 'Категория')}
                {renderSortableHeader('responsible', 'Ответственный')}
                <TableHead>Комментарий</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedExpenses.length > 0 ? (
                filteredAndSortedExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell className="font-medium whitespace-nowrap">
                      {format(expense.date, 'd MMM yyyy, HH:mm', { locale: ru })}
                    </TableCell>
                    <TableCell className="font-semibold whitespace-nowrap">
                      {expense.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                    </TableCell>
                    <TableCell>{expense.category}</TableCell>
                    <TableCell>{userMap[expense.responsible] || expense.responsible}</TableCell>
                    <TableCell className="min-w-[200px] max-w-[400px] whitespace-pre-wrap break-words">
                        {expense.comment || '–'}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Нет расходов для отображения по заданным фильтрам.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
