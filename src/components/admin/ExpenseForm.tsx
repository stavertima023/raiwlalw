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
import { ExpenseSchema } from '@/lib/types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { X, Upload } from 'lucide-react';
import Image from 'next/image';

// Form schema without id and responsible (auto-set)
const FormSchema = ExpenseSchema.pick({
  amount: true,
  category: true,
  comment: true,
  receiptPhoto: true,
});

type ExpenseFormValues = z.infer<typeof FormSchema>;

type ExpenseFormProps = {
  onSave: (data: ExpenseFormValues) => void;
  onCancel: () => void;
};

export function ExpenseForm({ onSave, onCancel }: ExpenseFormProps) {
  const [receiptPhoto, setReceiptPhoto] = React.useState<string>('');
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      amount: undefined,
      category: undefined,
      comment: '',
      receiptPhoto: '',
    },
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    if (!file.type.startsWith('image/')) {
      alert('Файл должен быть изображением');
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setReceiptPhoto(result);
        form.setValue('receiptPhoto', result);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      alert('Произошла ошибка при загрузке фотографии');
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = () => {
    setReceiptPhoto('');
    form.setValue('receiptPhoto', '');
  };

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
                <Input 
                  type="number" 
                  placeholder="Введите сумму" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
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
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите категорию" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Аренда">Аренда</SelectItem>
                  <SelectItem value="Зарплата">Зарплата</SelectItem>
                  <SelectItem value="Расходники">Расходники</SelectItem>
                  <SelectItem value="Маркетинг">Маркетинг</SelectItem>
                  <SelectItem value="Налоги">Налоги</SelectItem>
                  <SelectItem value="Другое">Другое</SelectItem>
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
                <Textarea placeholder="Описание расхода..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Receipt Photo Upload */}
        <FormField
          control={form.control}
          name="receiptPhoto"
          render={() => (
            <FormItem>
              <FormLabel>Фото чека (необязательно)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload}
                    className="hidden" 
                    accept="image/*"
                  />
                  
                  {receiptPhoto ? (
                    <div className="relative group w-40 h-40">
                      <Image
                        src={receiptPhoto}
                        alt="Фото чека"
                        width={160}
                        height={160}
                        className="rounded-md object-cover w-full h-full border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={handleRemovePhoto}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="h-40 w-40 border-dashed flex flex-col items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mb-2"></div>
                          <span className="text-sm">Загрузка...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-6 w-6 mb-2" />
                          <span className="text-sm">Загрузить чек</span>
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onCancel}>
            Отмена
          </Button>
          <Button type="submit">
            Сохранить
          </Button>
        </div>
      </form>
    </Form>
  );
} 