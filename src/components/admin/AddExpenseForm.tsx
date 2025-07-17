
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
import { Check, PlusCircle, Plus, X } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';

type ExpenseFormData = z.infer<typeof ExpenseSchema>;

interface AddExpenseFormProps {
  onSave: (data: Omit<Expense, 'id' | 'date'>) => void;
  currentUser: User;
}

export function AddExpenseForm({ onSave, currentUser }: AddExpenseFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<Omit<ExpenseFormData, 'id' | 'date'>>({
    resolver: zodResolver(ExpenseSchema.omit({ id: true, date: true })),
    defaultValues: {
      amount: undefined,
      category: undefined,
      responsible: currentUser.id,
      comment: '',
      receiptPhoto: undefined,
    },
    mode: 'onChange',
  });
  
  const { watch, setValue, getValues } = form;
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

    if(fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };
  
  const handleRemovePhoto = () => {
    setValue('receiptPhoto', undefined, { shouldValidate: true });
  };

  const onSubmit = (data: Omit<ExpenseFormData, 'id' | 'date'>) => {
    console.log('Form data before cleanup:', data);
    
    // Clean up the data before sending
    const cleanData = {
      ...data,
      amount: Number(data.amount),
      category: data.category,
      comment: data.comment || '',
      receiptPhoto: data.receiptPhoto || undefined,
    };
    
    console.log('Form data after cleanup:', cleanData);
    onSave(cleanData);
    handleClose();
    toast({
      title: 'Расход добавлен',
      description: 'Новая запись о расходах успешно создана.',
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
        <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            Добавить расход
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Новый расход</DialogTitle>
          <DialogDescription>Заполните информацию о новом расходе.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-4">
                    <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Сумма</FormLabel>
                        <FormControl>
                            <Input 
                                type="number" 
                                placeholder="5000" 
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                            />
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
                        <Select onValueChange={field.onChange} value={field.value || ''}>
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
                        <FormControl>
                            <Input 
                                {...field} 
                                value={currentUser.name}
                                disabled
                                className="bg-muted"
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
                        <FormLabel>Комментарий</FormLabel>
                        <FormControl>
                            <Textarea placeholder="Например, аренда за октябрь" {...field} />
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
                                                data-ai-hint="receipt photo"
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
                <Check className="mr-2 h-4 w-4" /> Сохранить
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
