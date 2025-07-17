
'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { Expense, User } from '@/lib/types-pure';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { AddExpenseForm } from './AddExpenseForm';
import { ExpensesFilters } from './ExpensesFilters';

interface ExpensesListProps {
  allExpenses: Expense[];
  allUsers: User[];
  onAddExpense: (expense: Omit<Expense, 'id' | 'date'>) => void;
  currentUser: Omit<User, 'password_hash'>;
}

interface ExpenseSortDescriptor {
  column: keyof Expense;
  direction: 'asc' | 'desc';
}

export const ExpensesList: React.FC<ExpensesListProps> = ({ allExpenses, allUsers, onAddExpense, currentUser }) => {
  const [filters, setFilters] = React.useState({
    category: 'all' as Expense['category'] | 'all',
    dateFrom: '',
    dateTo: '',
  });

  const [sortDescriptor, setSortDescriptor] = React.useState<ExpenseSortDescriptor>({
    column: 'date',
    direction: 'desc',
  });

  const handleSort = (column: keyof Expense) => {
    const isAsc = sortDescriptor.column === column && sortDescriptor.direction === 'asc';
    setSortDescriptor({ column, direction: isAsc ? 'desc' : 'asc' });
  };

  const filteredAndSortedExpenses = React.useMemo(() => {
    let filtered = [...allExpenses];

    if (filters.category !== 'all') {
      filtered = filtered.filter(expense => expense.category === filters.category);
    }
    
    // Filter by date range
    if (filters.dateFrom) {
      const fromDate = new Date(filters.dateFrom);
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= fromDate;
      });
    }

    if (filters.dateTo) {
      const toDate = new Date(filters.dateTo);
      toDate.setHours(23, 59, 59, 999); // End of day
      filtered = filtered.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate <= toDate;
      });
    }

    filtered.sort((a, b) => {
      const aValue = a[sortDescriptor.column] ?? 0;
      const bValue = b[sortDescriptor.column] ?? 0;
      
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
        <AddExpenseForm onSave={onAddExpense} currentUser={currentUser} />
      </div>

      <ExpensesFilters
        onFilterChange={React.useCallback((newFilters) => setFilters({
          category: newFilters.category,
          dateFrom: newFilters.dateFrom || '',
          dateTo: newFilters.dateTo || '',
        }), [])}
        currentFilters={filters}
        onClear={React.useCallback(() => setFilters({ category: 'all', dateFrom: '', dateTo: '' }), [])}
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
                <TableHead>Чек</TableHead>
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
                    <TableCell>
                      {allUsers.find(user => user.id === expense.responsible)?.name || expense.responsible}
                    </TableCell>
                    <TableCell className="min-w-[200px] max-w-[400px] whitespace-pre-wrap break-words">
                        {expense.comment || '–'}
                    </TableCell>
                    <TableCell>
                      {expense.receiptPhoto ? (
                         <Dialog>
                              <DialogTrigger asChild>
                                <button>
                                  <Image
                                    src={expense.receiptPhoto}
                                    alt="Фото чека"
                                    width={40}
                                    height={40}
                                    className="rounded-md object-cover cursor-pointer"
                                    data-ai-hint="receipt photo"
                                  />
                                </button>
                              </DialogTrigger>
                              <DialogContent className="max-w-md p-2 sm:max-w-lg md:max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Фото чека</DialogTitle>
                                </DialogHeader>
                                <div className="flex justify-center">
                                  <Image
                                    src={expense.receiptPhoto}
                                    alt="Фото чека"
                                    width={800}
                                    height={800}
                                    className="rounded-md object-contain max-h-[80vh]"
                                     data-ai-hint="receipt photo"
                                  />
                                </div>
                              </DialogContent>
                            </Dialog>
                      ) : (
                        <div className="rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs h-10 w-10">
                            Нет
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
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
