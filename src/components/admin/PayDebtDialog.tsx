'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Debt } from '@/lib/types';
import { Check, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

const PayDebtSchema = z.object({
  amount: z.coerce.number().positive('Сумма должна быть положительной'),
  comment: z.string().optional(),
  receiptPhoto: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
});

type PayDebtFormData = z.infer<typeof PayDebtSchema>;

interface PayDebtDialogProps {
  children: React.ReactNode;
  debt: Debt;
  currentAmount: number;
  onPayDebt: (debtId: string, amount: number, personName: string, comment?: string, receiptPhoto?: string) => void;
}

export function PayDebtDialog({ children, debt, currentAmount, onPayDebt }: PayDebtDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<PayDebtFormData>({
    resolver: zodResolver(PayDebtSchema),
    defaultValues: {
      amount: undefined,
      comment: '',
      receiptPhoto: undefined,
    },
    mode: 'onChange',
  });

  const { watch, setValue } = form;
  const watchedPhoto = watch('receiptPhoto');

  const handleClose = () => {
    form.reset();
    setIsOpen(false);
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
      setValue('receiptPhoto', result, { shouldValidate: true });
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
    setValue('receiptPhoto', undefined, { shouldValidate: true });
  };

  const onSubmit = (data: PayDebtFormData) => {
    if (data.amount > currentAmount) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Сумма погашения не может превышать текущий долг.',
      });
      return;
    }

    onPayDebt(debt.id!, data.amount, debt.personName, data.comment, data.receiptPhoto);
    handleClose();
    toast({
      title: 'Долг погашен',
      description: 'Погашение долга успешно зафиксировано.',
    });
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
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Погашение долга</DialogTitle>
          <DialogDescription>
            Погашение долга кассы {debt.personName}. Текущий долг: {currentAmount.toLocaleString('ru-RU')} ₽
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма погашения</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="1000" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      max={currentAmount}
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
              name="receiptPhoto"
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

            <DialogFooter>
              <Button type="button" variant="secondary" onClick={handleClose}>
                Отмена
              </Button>
              <Button type="submit">
                <Check className="mr-2 h-4 w-4" /> Погасить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 