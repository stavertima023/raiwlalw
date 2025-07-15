'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { AddExpenseForm } from './AddExpenseForm';
import { Expense, User } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

type AddExpenseDialogProps = {
  onAddExpense: (expense: Omit<Expense, 'id' | 'date' | 'responsible'>) => void;
  currentUser: Omit<User, 'password_hash'>;
};

export function AddExpenseDialog({ onAddExpense, currentUser }: AddExpenseDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSave = (expenseData: Omit<Expense, 'id' | 'date' | 'responsible'>) => {
    onAddExpense(expenseData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Добавить расход
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Новый расход</DialogTitle>
          <DialogDescription>
            Заполните все поля для добавления нового расхода.
          </DialogDescription>
        </DialogHeader>
        <AddExpenseForm onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
} 