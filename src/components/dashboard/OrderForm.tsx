
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
import { Plus, X } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

// Updated form schema: shipmentNumber is required, cost is removed, photos added
const FormSchema = z.object({
    orderNumber: z.string().min(1, 'Номер заказа обязателен'),
    shipmentNumber: z.string().min(1, 'Номер отправления обязателен'),
    productType: ProductTypeEnum,
    size: SizeEnum,
    price: z.coerce.number().positive('Цена должна быть положительной'),
    photos: z.array(z.string()).max(3, 'Максимум 3 фотографии').optional().default([]),
    comment: z.string().optional(),
});

type OrderFormValues = z.infer<typeof FormSchema>;

type OrderFormProps = {
  onSave: (data: OrderFormValues) => void;
  initialData?: Partial<OrderFormValues>;
};

export function OrderForm({ onSave, initialData }: OrderFormProps) {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  const form = useForm<OrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orderNumber: initialData?.orderNumber || '',
      shipmentNumber: initialData?.shipmentNumber || '',
      productType: initialData?.productType || undefined,
      size: initialData?.size || undefined,
      price: initialData?.price || 0,
      photos: initialData?.photos || [],
      comment: initialData?.comment || '',
    },
  });

  const { watch, setValue, getValues } = form;
  const watchedPhotos = watch('photos');

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentPhotos = getValues('photos');
    const availableSlots = 3 - currentPhotos.length;

    if (files.length > availableSlots) {
      toast({
        variant: 'destructive',
        title: 'Слишком много файлов',
        description: `Вы можете загрузить еще ${availableSlots} фото.`,
      });
    }

    const filesToProcess = Array.from(files).slice(0, availableSlots);

    filesToProcess.forEach(file => {
      if (!file.type.startsWith('image/')) {
        toast({
          variant: 'destructive',
          title: 'Неверный тип файла',
          description: `Файл "${file.name}" не является изображением.`,
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          variant: 'destructive',
          title: 'Файл слишком большой',
          description: `Файл "${file.name}" превышает 5MB.`,
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setValue('photos', [...getValues('photos'), result], { shouldValidate: true });
      };
      reader.readAsDataURL(file);
    });

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleAddPhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemovePhoto = (index: number) => {
    const photos = getValues('photos');
    const newPhotos = photos.filter((_, i) => i !== index);
    setValue('photos', newPhotos, { shouldValidate: true });
  };

  const onSubmit = (data: OrderFormValues) => {
    onSave(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[80vh] overflow-y-auto">
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
          name="shipmentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер отправления</FormLabel>
              <FormControl>
                <Input placeholder="SHP-A1B2" {...field} />
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
          name="photos"
          render={() => (
            <FormItem>
              <FormLabel>Фотографии (до 3)</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handlePhotoUpload}
                    className="hidden" 
                    accept="image/*"
                    multiple
                  />
                  
                  <div className="flex flex-wrap gap-2">
                    {watchedPhotos?.map((photo, index) => (
                      <div key={index} className="relative group w-20 h-20">
                        <Image
                          src={photo}
                          alt={`Фото товара ${index + 1}`}
                          width={80}
                          height={80}
                          className="rounded-md object-cover w-full h-full border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemovePhoto(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                    
                    {(watchedPhotos?.length || 0) < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-20 w-20 border-dashed flex-shrink-0"
                        onClick={handleAddPhotoClick}
                      >
                        <Plus className="h-6 w-6 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                </div>
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
        
        <Button type="submit" className="w-full">Сохранить заказ</Button>
      </form>
    </Form>
  );
}
