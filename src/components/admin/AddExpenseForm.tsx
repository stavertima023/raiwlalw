
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ExpenseSchema, ExpenseCategoryEnum } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const FormSchema = ExpenseSchema.pick({
    amount: true,
    category: true,
    comment: true,
});

type ExpenseFormValues = z.infer<typeof FormSchema>;

type AddExpenseFormProps = {
  onSave: (data: ExpenseFormValues) => void;
};

export function AddExpenseForm({ onSave }: AddExpenseFormProps) {
  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: 0,
      category: undefined,
      comment: '',
    },
  });

  const onSubmit = (data: ExpenseFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
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
                  <SelectTrigger><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                 </FormControl>
                 <SelectContent>
                    {ExpenseCategoryEnum.options.map(option => (
                        <SelectItem key={option} value={option}>{option}</SelectItem>
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
                <Textarea placeholder="Например, оплата аренды за май" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Сохранить</Button>
      </form>
    </Form>
  );
}
