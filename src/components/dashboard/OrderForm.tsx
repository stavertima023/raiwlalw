
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
import { X, Plus, Upload } from 'lucide-react';
import Image from 'next/image';

// Updated form schema with shipmentNumber required and cost removed
const FormSchema = OrderSchema.pick({
    orderNumber: true,
    shipmentNumber: true,
    productType: true,
    size: true,
    price: true,
    comment: true,
    photos: true
}).extend({
    shipmentNumber: z.string().min(1, 'Номер отправления обязателен'),
});

type OrderFormValues = z.infer<typeof FormSchema>;

type OrderFormProps = {
  onSave: (data: OrderFormValues) => void;
  initialData?: Partial<OrderFormValues>;
};

export function OrderForm({ onSave, initialData }: OrderFormProps) {
  const [photos, setPhotos] = React.useState<string[]>(initialData?.photos || []);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orderNumber: initialData?.orderNumber || '',
      shipmentNumber: initialData?.shipmentNumber || '',
      productType: initialData?.productType || undefined,
      size: initialData?.size || undefined,
      price: initialData?.price,
      comment: initialData?.comment || '',
      photos: photos,
    },
  });

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentPhotos = photos;
    const totalSlots = 3 - currentPhotos.length;

    if (files.length > totalSlots) {
      if (totalSlots === 0) {
        alert('Достигнут лимит фотографий (максимум 3)');
      } else {
        alert(`Можно загрузить еще ${totalSlots} фото (выбрано ${files.length})`);
      }
      return;
    }

    const filesToProcess = Array.from(files).slice(0, totalSlots);
    
    // Validate all files first
    for (const file of filesToProcess) {
      if (!file.type.startsWith('image/')) {
        alert(`Файл "${file.name}" не является изображением`);
        return;
      }
    }

    setIsUploading(true);

    try {
      // Process all files and collect results
      const loadPromises = filesToProcess.map(file => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            resolve(result);
          };
          reader.onerror = () => reject(new Error(`Ошибка чтения файла ${file.name}`));
          reader.readAsDataURL(file);
        });
      });

      // Wait for all files to load and update state once
      const results = await Promise.all(loadPromises);
      const newPhotos = [...photos, ...results];
      setPhotos(newPhotos);
      form.setValue('photos', newPhotos);
      
      // Show success message
      if (results.length > 1) {
        alert(`Успешно загружено ${results.length} фотографий`);
      }
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      alert('Произошла ошибка при загрузке фотографий');
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    form.setValue('photos', newPhotos);
  };

  const onSubmit = (data: OrderFormValues) => {
    onSave({ ...data, photos });
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
          name="shipmentNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Номер отправления</FormLabel>
              <FormControl>
                <Input placeholder="SHP-A1B2C3" {...field} />
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
                <Input 
                  type="number" 
                  placeholder="С учетом Авито комиссии" 
                  {...field}
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Photo Upload Section */}
        <FormField
          control={form.control}
          name="photos"
          render={() => (
            <FormItem>
              <FormLabel>Фотографии (до 3)</FormLabel>
              <p className="text-sm text-muted-foreground">
                Можно выбрать несколько фото одновременно
              </p>
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
                    {photos.map((photo, index) => (
                      <div key={index} className="relative group w-20 h-20">
                        <Image
                          src={photo}
                          alt={`Фото ${index + 1}`}
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
                    
                    {photos.length < 3 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="h-20 w-20 border-dashed flex flex-col items-center justify-center"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                      >
                        {isUploading ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mb-1"></div>
                            <span className="text-xs">Загрузка...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 mb-1" />
                            <span className="text-xs">Фото</span>
                          </>
                        )}
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
        
        <Button type="submit">Сохранить</Button>
      </form>
    </Form>
  );
}
