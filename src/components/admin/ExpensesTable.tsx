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
import type { Expense } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

interface ExpensesTableProps {
  expenses: Expense[];
}

interface ExpenseSortDescriptor {
  column: keyof Expense;
  direction: 'asc' | 'desc';
}

export function ExpensesTable({ expenses }: ExpensesTableProps) {
  const [sortDescriptor, setSortDescriptor] = React.useState<ExpenseSortDescriptor>({
    column: 'date',
    direction: 'desc',
  });

  const handleSort = (column: keyof Expense) => {
    const isAsc = sortDescriptor.column === column && sortDescriptor.direction === 'asc';
    setSortDescriptor({ column, direction: isAsc ? 'desc' : 'asc' });
  };

  const sortedExpenses = React.useMemo(() => {
    let sorted = [...expenses];
    sorted.sort((a, b) => {
      const aValue = a[sortDescriptor.column] ?? '';
      const bValue = b[sortDescriptor.column] ?? '';
      
      let cmp = 0;
      if (aValue > bValue) cmp = 1;
      if (aValue < bValue) cmp = -1;

      return sortDescriptor.direction === 'desc' ? -cmp : cmp;
    });
    return sorted;
  }, [expenses, sortDescriptor]);

  const renderSortableHeader = (column: keyof Expense, label: string) => (
    <TableHead>
      <Button variant="ghost" onClick={() => handleSort(column)} className="-ml-4">
        {label}
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    </TableHead>
  );

  return (
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
            {sortedExpenses.length > 0 ? (
              sortedExpenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(expense.date), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">
                    {expense.amount.toLocaleString('ru-RU', { style: 'currency', currency: 'RUB' })}
                  </TableCell>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.responsible}</TableCell>
                  <TableCell className="min-w-[200px] max-w-[400px] whitespace-pre-wrap break-words">
                      {expense.comment || '–'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  Нет расходов для отображения.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
} 