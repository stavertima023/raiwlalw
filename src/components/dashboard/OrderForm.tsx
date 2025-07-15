
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { OrderSchema, ProductTypeEnum, SizeEnum } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

// We only need a subset of fields for the form
const FormSchema = OrderSchema.pick({
    orderNumber: true,
    productType: true,
    size: true,
    price: true,
    cost: true,
    comment: true
});

type OrderFormValues = z.infer<typeof FormSchema>;

type OrderFormProps = {
  onSave: (data: OrderFormValues) => void;
  initialData?: OrderFormValues;
};

export function OrderForm({ onSave, initialData }: OrderFormProps) {
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: initialData || {
      orderNumber: '',
      productType: undefined,
      size: undefined,
      price: 0,
      cost: 0,
      comment: '',
    },
  });

  const onSubmit = (data: OrderFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4">
        <FormField
          control={form.control}
          name="orderNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер заказа</FormLabel>
              <FormControl>
                <Input placeholder="WB-12345" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="productType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Тип товара</FormLabel>
               <Select onValueChange={field.onChange} defaultValue={field.value}>
                 <FormControl>
                  <SelectTrigger><SelectValue placeholder="Выберите тип" /></SelectTrigger>
                 </FormControl>
                 <SelectContent>
                    {ProductTypeEnum.options.map(option => (
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
          name="size"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Размер</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                 <FormControl>
                  <SelectTrigger><SelectValue placeholder="Выберите размер" /></SelectTrigger>
                 </FormControl>
                 <SelectContent>
                    {SizeEnum.options.map(option => (
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
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Цена</FormLabel>
              <FormControl>
                <Input type="number" placeholder="1500" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="cost"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Себестоимость</FormLabel>
              <FormControl>
                <Input type="number" placeholder="500" {...field} />
              </FormControl>
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
                <Textarea placeholder="Любые детали..." {...field} />
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
