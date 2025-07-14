
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseSchema, ExpenseCategoryEnum, User, Expense } from '@/lib/types';
import { Check, PlusCircle } from 'lucide-react';

type ExpenseFormData = z.infer<typeof ExpenseSchema>;

interface AddExpenseFormProps {
  onSave: (data: Omit<Expense, 'id' | 'date'>) => void;
  allUsers: User[];
  currentUser: User;
}

export function AddExpenseForm({ onSave, allUsers, currentUser }: AddExpenseFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<Omit<ExpenseFormData, 'id' | 'date'>>({
    resolver: zodResolver(ExpenseSchema.omit({ id: true, date: true })),
    defaultValues: {
      amount: '' as any,
      category: undefined,
      responsible: currentUser.telegramId,
      comment: '',
    },
    mode: 'onChange',
  });

  const onSubmit = (data: Omit<ExpenseFormData, 'id' | 'date'>) => {
    onSave(data);
    handleClose();
    toast({
      title: 'Расход добавлен',
      description: 'Новая запись о расходах успешно создана.',
    });
  };

  const handleClose = () => {
    form.reset();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            handleClose();
        } else {
            setIsOpen(true);
        }
    }}>
      <DialogTrigger asChild>
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить расход
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Новый расход</DialogTitle>
          <DialogDescription>Заполните информацию о новом расходе.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="5000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Категория</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите категорию..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ExpenseCategoryEnum.options.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="responsible"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ответственный</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите ответственного..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {allUsers.map((user) => (
                        <SelectItem key={user.telegramId} value={user.telegramId}>
                          {user.name} ({user.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Например, аренда за октябрь" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Отмена
              </Button>
              <Button type="submit">
                <Check className="mr-2 h-4 w-4" /> Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
