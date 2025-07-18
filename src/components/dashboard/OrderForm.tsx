
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
import { X, Plus, Upload, Camera, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';

// Упрощенная схема формы с лучшей обработкой данных
const FormSchema = z.object({
    orderNumber: z.string().min(1, 'Номер заказа обязателен').transform(val => val.trim()),
    shipmentNumber: z.string().min(1, 'Номер отправления обязателен').transform(val => val.trim()),
    productType: z.string().refine(val => val && ['фб', 'фч', 'хч', 'хб', 'хс', 'шч', 'лб', 'лч', 'другое'].includes(val), {
      message: 'Выберите тип товара'
    }),
    size: z.string().refine(val => val && ['S', 'M', 'L', 'XL'].includes(val), {
      message: 'Выберите размер'
    }),
    price: z.union([
      z.number().positive('Цена должна быть положительной'),
      z.string().transform(val => {
        const num = parseFloat(val);
        if (isNaN(num) || num <= 0) throw new Error('Цена должна быть положительной');
        return num;
      })
    ]),
    comment: z.string().optional().default('').transform(val => val || ''),
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
  const cameraInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);

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
    if (!files || files.length === 0) {
      console.log('No files selected or selection cancelled');
      return;
    }

    console.log(`Selected ${files.length} files:`, Array.from(files).map(f => ({ name: f.name, size: f.size, type: f.type })));

    const currentPhotos = form.getValues('photos') || [];
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
      
      // Проверяем размер файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert(`Файл "${file.name}" слишком большой (максимум 10MB)`);
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
            if (result) {
              console.log(`Successfully loaded file: ${file.name}`);
              resolve(result);
            } else {
              reject(new Error(`Failed to load file: ${file.name}`));
            }
          };
          
          reader.onerror = () => {
            console.error(`Error reading file: ${file.name}`, reader.error);
            const errorMessage = reader.error?.name === 'QuotaExceededError' 
              ? `Файл "${file.name}" слишком большой для обработки. Попробуйте уменьшить размер изображения.`
              : `Ошибка чтения файла ${file.name}`;
            reject(new Error(errorMessage));
          };
          
          reader.onabort = () => {
            console.error(`File reading aborted: ${file.name}`);
            reject(new Error(`Чтение файла прервано: ${file.name}`));
          };
          
          // Используем readAsDataURL для лучшей совместимости с Android
          reader.readAsDataURL(file);
        });
      });

      // Wait for all files to load and update state once
      const results = await Promise.all(loadPromises);
      console.log(`Successfully processed ${results.length} files`);
      
      // Update form value directly
      const currentPhotos = form.getValues('photos') || [];
      const newPhotos = [...currentPhotos, ...results];
      form.setValue('photos', newPhotos);
      
      console.log(`Total photos now: ${newPhotos.length}`);
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      alert(`Произошла ошибка при загрузке фотографий: ${errorMessage}`);
    } finally {
      setIsUploading(false);
    }

    // Reset file input - важно для Android
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Обработчик для отмены выбора файлов
  const handleFileInputClick = () => {
    if (fileInputRef.current) {
      // Сбрасываем значение перед кликом для Android
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  // Обработчик для камеры
  const handleCameraClick = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
      cameraInputRef.current.click();
    }
  };

  // Обработчик для галереи
  const handleGalleryClick = () => {
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
      galleryInputRef.current.click();
    }
  };

  // Обработчик для случая, когда пользователь возвращается из галереи
  const handleFileInputFocus = () => {
    console.log('File input focused');
  };

  const handleFileInputBlur = () => {
    console.log('File input blurred');
  };

  const handleRemovePhoto = (index: number) => {
    const currentPhotos = form.getValues('photos') || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    form.setValue('photos', newPhotos);
  };

  const onSubmit = (data: OrderFormValues) => {
    console.log('Form data before validation:', data);
    
    // Дополнительная валидация перед отправкой
    if (!data.orderNumber?.trim()) {
      alert('Номер заказа обязателен');
      return;
    }
    
    if (!data.shipmentNumber?.trim()) {
      alert('Номер отправления обязателен');
      return;
    }
    
    if (!data.productType || !['фб', 'фч', 'хч', 'хб', 'хс', 'шч', 'лб', 'лч', 'другое'].includes(data.productType)) {
      alert('Выберите тип товара');
      return;
    }
    
    if (!data.size || !['S', 'M', 'L', 'XL'].includes(data.size)) {
      alert('Выберите размер');
      return;
    }
    
    if (!data.price || data.price <= 0) {
      alert('Цена должна быть положительной');
      return;
    }
    
    // Очищаем и подготавливаем данные для отправки
    const cleanedData = {
      orderNumber: data.orderNumber.trim(),
      shipmentNumber: data.shipmentNumber.trim(),
      productType: data.productType,
      size: data.size,
      price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
      comment: data.comment?.trim() || '',
      photos: Array.isArray(data.photos) ? data.photos : [],
    };
    
    console.log('Cleaned data for submission:', cleanedData);
    
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
                Выберите источник: камера для нового снимка или галерея для существующих фото
              </p>
                            <FormControl>
                <div className="space-y-4">
                                    {/* Input для камеры */}
                                    <input 
                                        type="file" 
                                        ref={cameraInputRef} 
                                        onChange={handlePhotoUpload}
                                        className="hidden" 
                                        accept="image/*"
                                        capture="environment"
                                     />
                                    
                                    {/* Input для галереи */}
                                    <input 
                                        type="file" 
                                        ref={galleryInputRef} 
                                        onChange={handlePhotoUpload}
                                        className="hidden" 
                                        accept="image/*"
                                        multiple
                                     />
                                    
                                    {/* Универсальный input для обратной совместимости */}
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handlePhotoUpload}
                                        onFocus={handleFileInputFocus}
                                        onBlur={handleFileInputBlur}
                                        className="hidden" 
                                        accept="image/*"
                                        multiple
                                        onTouchStart={() => console.log('Touch start on file input')}
                                        onTouchEnd={() => console.log('Touch end on file input')}
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
                      <div className="flex flex-col gap-2">
                        {/* Кнопка для камеры */}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-16 w-20 border-dashed flex flex-col items-center justify-center"
                          onClick={handleCameraClick}
                          disabled={isUploading}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            console.log('Touch start on camera button');
                          }}
                          onTouchEnd={(e) => {
                            console.log('Touch end on camera button');
                            setTimeout(() => {
                              handleCameraClick();
                            }, 100);
                          }}
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mb-1"></div>
                              <span className="text-xs">Загрузка...</span>
                            </>
                          ) : (
                            <>
                              <Camera className="h-4 w-4 mb-1" />
                              <span className="text-xs">Камера</span>
                            </>
                          )}
                        </Button>
                        
                        {/* Кнопка для галереи */}
                        <Button
                          type="button"
                          variant="outline"
                          className="h-16 w-20 border-dashed flex flex-col items-center justify-center"
                          onClick={handleGalleryClick}
                          disabled={isUploading}
                          onTouchStart={(e) => {
                            e.preventDefault();
                            console.log('Touch start on gallery button');
                          }}
                          onTouchEnd={(e) => {
                            console.log('Touch end on gallery button');
                            setTimeout(() => {
                              handleGalleryClick();
                            }, 100);
                          }}
                        >
                          {isUploading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900 mb-1"></div>
                              <span className="text-xs">Загрузка...</span>
                            </>
                          ) : (
                            <>
                              <ImageIcon className="h-4 w-4 mb-1" />
                              <span className="text-xs">Галерея</span>
                            </>
                          )}
                        </Button>
                      </div>
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
