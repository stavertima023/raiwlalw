
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
import { X, Plus, Upload, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { safeImageToDataURL, cleanImageArray } from '@/lib/imageUtils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

// Updated form schema with shipmentNumber required and cost removed
const FormSchema = z.object({
    orderNumber: z.string().min(1, 'Номер заказа обязателен'),
    shipmentNumber: z.string().min(1, 'Номер отправления обязателен'),
    productType: ProductTypeEnum,
    size: SizeEnum,
    price: z.coerce.number().positive('Цена должна быть положительной'),
    comment: z.string().optional().default(''),
    photos: z.array(z.string()).max(3).optional().default([]),
});

type OrderFormValues = z.infer<typeof FormSchema>;

type OrderFormProps = {
  onSave: (data: OrderFormValues) => void;
  initialData?: Partial<OrderFormValues>;
};

export function OrderForm({ onSave, initialData }: OrderFormProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      orderNumber: initialData?.orderNumber || '',
      shipmentNumber: initialData?.shipmentNumber || '',
      productType: initialData?.productType || undefined,
      size: initialData?.size || undefined,
      price: initialData?.price || undefined,
      comment: initialData?.comment || '',
      photos: initialData?.photos || [],
    },
  });

  // Watch photos value from form
  const photos = form.watch('photos') || [];
  
  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const filesToProcess = Array.from(files);
      console.log(`Обрабатываем ${filesToProcess.length} файлов...`);

      // Проверяем доступные слоты для фотографий
      const currentPhotos = form.getValues('photos') || [];
      const availableSlots = 3 - currentPhotos.length;
      
      if (filesToProcess.length > availableSlots) {
        alert(`Можно добавить еще ${availableSlots} фото (выбрано ${filesToProcess.length})`);
        setIsUploading(false);
        return;
      }

      // Обрабатываем файлы по одному для лучшей надежности
      const results: string[] = [];
      const errors: string[] = [];
      
      for (let i = 0; i < filesToProcess.length; i++) {
        const file = filesToProcess[i];
        try {
          console.log(`Обрабатываем файл ${i + 1}/${filesToProcess.length}: ${file.name} (${file.size} байт, тип: ${file.type})`);
          
          const result = await safeImageToDataURL(file);
          
          if (result.success && result.dataUrl) {
            results.push(result.dataUrl);
            console.log(`✅ Файл ${file.name} успешно обработан`);
          } else {
            const errorMsg = result.error || 'Неизвестная ошибка';
            console.warn(`❌ Не удалось обработать файл ${file.name}:`, errorMsg);
            errors.push(`${file.name}: ${errorMsg}`);
          }
        } catch (fileError) {
          const errorMsg = fileError instanceof Error ? fileError.message : 'Неизвестная ошибка';
          console.error(`❌ Ошибка обработки файла ${file.name}:`, fileError);
          errors.push(`${file.name}: ${errorMsg}`);
        }
      }

      if (results.length > 0) {
        // Очищаем и валидируем результаты
        const cleanedResults = cleanImageArray(results);
        const newPhotos = [...currentPhotos, ...cleanedResults];
        
        // Проверяем общий размер фотографий
        const totalSize = cleanedResults.reduce((total, photo) => {
          const base64Data = photo.split(',')[1];
          if (base64Data) {
            return total + Math.ceil((base64Data.length * 3) / 4);
          }
          return total;
        }, 0);
        
        const totalSizeInMB = totalSize / (1024 * 1024);
        console.log(`📊 Общий размер фотографий: ${totalSizeInMB.toFixed(2)}MB`);
        
        if (totalSizeInMB > 6) { // 6MB лимит (уменьшен для предотвращения ошибок Kong)
          alert(`⚠️ Внимание: Общий размер фотографий (${totalSizeInMB.toFixed(2)}MB) близок к лимиту. Некоторые фотографии могут быть автоматически сжаты.`);
        }
        
        form.setValue('photos', newPhotos);
        
        // Показываем результаты пользователю
        if (cleanedResults.length === results.length && errors.length === 0) {
          alert(`✅ Успешно загружено ${cleanedResults.length} изображений!`);
        } else if (cleanedResults.length > 0) {
          const successMsg = `✅ Успешно загружено ${cleanedResults.length} из ${filesToProcess.length} изображений.`;
          const errorMsg = errors.length > 0 ? `\n\n❌ Ошибки:\n${errors.slice(0, 3).join('\n')}` : '';
          const moreErrors = errors.length > 3 ? `\n... и еще ${errors.length - 3} ошибок` : '';
          alert(successMsg + errorMsg + moreErrors);
        } else {
          alert(`❌ Не удалось загрузить ни одного изображения.\n\nОшибки:\n${errors.join('\n')}\n\nПопробуйте выбрать другие файлы или уменьшить их размер.`);
        }
      } else {
        alert(`❌ Не удалось загрузить ни одного изображения.\n\nОшибки:\n${errors.join('\n')}\n\nПопробуйте выбрать другие файлы или уменьшить их размер.`);
      }
    } catch (error) {
      console.error('❌ Общая ошибка загрузки фото:', error);
      alert(`❌ Произошла ошибка при загрузке фотографий: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`);
    } finally {
      setIsUploading(false);
    }

    // Reset file input
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const handleRemovePhoto = (index: number) => {
    const currentPhotos = form.getValues('photos') || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    form.setValue('photos', newPhotos);
  };

  const onSubmit = (data: OrderFormValues) => {
    // Дополнительная валидация перед отправкой
    if (!data.orderNumber?.trim()) {
      alert('Номер заказа обязателен');
      return;
    }
    
    if (!data.shipmentNumber?.trim()) {
      alert('Номер отправления обязателен');
      return;
    }
    
    if (!data.productType) {
      alert('Выберите тип товара');
      return;
    }
    
    if (!data.size) {
      alert('Выберите размер');
      return;
    }
    
    if (!data.price || data.price <= 0) {
      alert('Цена должна быть положительной');
      return;
    }
    
    // Очищаем и валидируем фотографии
    const cleanedPhotos = cleanImageArray(data.photos || []);
    
    // Очищаем пробелы в строковых полях
    const cleanedData = {
      ...data,
      orderNumber: data.orderNumber.trim(),
      shipmentNumber: data.shipmentNumber.trim(),
      comment: data.comment?.trim() || '',
      photos: cleanedPhotos,
    };
    
    onSave(cleanedData);
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
                        <Dialog>
                          <DialogTrigger asChild>
                            <button className="w-full h-full rounded-md overflow-hidden border hover:opacity-80 transition-opacity">
                              <Image
                                src={photo}
                                alt={`Фото ${index + 1}`}
                                width={80}
                                height={80}
                                className="rounded-md object-cover w-full h-full"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all flex items-center justify-center">
                                <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                              </div>
                            </button>
                          </DialogTrigger>
                          <DialogContent className="max-w-[90vw] max-h-[90vh] p-2 sm:max-w-2xl md:max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>Фото {index + 1}</DialogTitle>
                            </DialogHeader>
                            <div className="flex justify-center items-center">
                              <Image
                                src={photo}
                                alt={`Фото ${index + 1}`}
                                width={800}
                                height={800}
                                className="rounded-md object-contain max-w-full max-h-[70vh]"
                              />
                            </div>
                          </DialogContent>
                        </Dialog>
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
