'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Debt, DebtPayment, User } from '@/lib/types';
import { Check, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

const PayDebtFormSchema = z.object({
  payment_amount: z.coerce.number().positive('Сумма должна быть положительной'),
  comment: z.string().optional(),
  receipt_photo: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
});

type PayDebtFormData = z.infer<typeof PayDebtFormSchema>;

interface PayDebtDialogProps {
  debt: Debt;
  currentUser: Omit<User, 'password_hash'>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayDebtDialog({ debt, currentUser, isOpen, onClose, onSuccess }: PayDebtDialogProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<PayDebtFormData>({
    resolver: zodResolver(PayDebtFormSchema),
    defaultValues: {
      payment_amount: undefined,
      comment: '',
      receipt_photo: undefined,
    },
  });

  const { watch, setValue } = form;
  const watchedPhoto = watch('receipt_photo');

  const handleClose = () => {
    form.reset();
    onClose();
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast({
        variant: 'destructive',
        title: 'Неверный тип файла',
        description: `Файл "${file.name}" не является изображением.`,
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setValue('receipt_photo', result, { shouldValidate: true });
    };
    reader.readAsDataURL(file);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = () => {
    setValue('receipt_photo', undefined, { shouldValidate: true });
  };

  const onSubmit = async (data: PayDebtFormData) => {
    try {
      // Проверяем, что сумма погашения не превышает долг
      if (data.payment_amount > debt.current_amount) {
        toast({
          variant: 'destructive',
          title: 'Ошибка',
          description: 'Сумма погашения не может превышать сумму долга.',
        });
        return;
      }

      const paymentData = {
        debt_id: debt.id,
        payment_amount: data.payment_amount,
        remaining_debt: debt.current_amount - data.payment_amount,
        receipt_photo: data.receipt_photo || undefined,
        comment: data.comment || '',
        processed_by: currentUser.name,
      };

      const response = await fetch('/api/debts/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка при погашении долга');
      }

      toast({
        title: 'Долг погашен',
        description: `Успешно погашено ${data.payment_amount.toLocaleString('ru-RU')} ₽`,
      });

      onSuccess();
    } catch (error) {
      console.error('Error paying debt:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: error instanceof Error ? error.message : 'Не удалось погасить долг',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Погашение долга</DialogTitle>
          <DialogDescription>
            Погашение долга кассы {debt.person_name} на сумму {debt.current_amount.toLocaleString('ru-RU')} ₽
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="payment_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Сумма погашения</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000"
                          {...field}
                          max={debt.current_amount}
                        />
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
                      <FormLabel>Комментарий (необязательно)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Например, погашение за октябрь" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receipt_photo"
                  render={() => (
                    <FormItem>
                      <FormLabel>Фото чека (необязательно)</FormLabel>
                      <FormControl>
                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handlePhotoUpload}
                            className="hidden"
                            accept="image/*"
                          />
                          {watchedPhoto ? (
                            <div className="relative group w-full h-48">
                              <Image
                                src={watchedPhoto}
                                alt="Receipt photo"
                                fill
                                className="rounded-md object-contain"
                              />
                              <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={handleRemovePhoto}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              type="button"
                              variant="outline"
                              className="h-28 w-full border-dashed"
                              onClick={handleAddPhotoClick}
                            >
                              <Plus className="h-8 w-8 text-muted-foreground" />
                            </Button>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </ScrollArea>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="secondary" onClick={handleClose}>
                Отмена
              </Button>
              <Button type="submit">
                <Check className="mr-2 h-4 w-4" />
                Погасить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 