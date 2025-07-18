
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

// Экстренная схема формы - принимает любые данные
const FormSchema = z.object({
    orderNumber: z.any().transform(val => String(val || '').trim()),
    shipmentNumber: z.any().transform(val => String(val || '').trim()),
    productType: z.any().transform(val => {
      const str = String(val || '').trim();
      return ['фб', 'фч', 'хч', 'хб', 'хс', 'шч', 'лб', 'лч', 'другое'].includes(str) ? str : 'другое';
    }),
    size: z.any().transform(val => {
      const str = String(val || '').trim();
      return ['S', 'M', 'L', 'XL'].includes(str) ? str : 'M';
    }),
    price: z.any().transform(val => {
      if (!val) return 0;
      const str = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
      const num = parseFloat(str);
      return isNaN(num) || num <= 0 ? 0 : num;
    }),
    comment: z.any().transform(val => String(val || '').trim()),
    photos: z.any().transform(val => {
      if (!Array.isArray(val)) return [];
      return val.filter(item => typeof item === 'string' && item.trim() !== '').slice(0, 3);
    }).optional().default([]),
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
    console.log('=== НАЧАЛО ОБРАБОТКИ ФАЙЛОВ ===');
    console.log('Event:', event);
    console.log('Event target:', event.target);
    console.log('Event target files:', event.target.files);
    
    const files = event.target.files;
    console.log('Files object:', files);
    console.log('Files length:', files?.length);
    
    if (!files || files.length === 0) {
      console.log('❌ НЕТ ФАЙЛОВ - ВЫХОД');
      // Сбрасываем input даже при отмене выбора
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    console.log(`✅ ВЫБРАНО ${files.length} ФАЙЛОВ`);
    
    // Логируем каждый файл подробно
    Array.from(files).forEach((file, index) => {
      console.log(`Файл ${index + 1}:`, {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        lastModifiedDate: new Date(file.lastModified)
      });
    });

    const currentPhotos = form.getValues('photos') || [];
    console.log('Текущие фото в форме:', currentPhotos.length);
    
    const totalSlots = 3 - currentPhotos.length;
    console.log('Доступно слотов:', totalSlots);

    if (files.length > totalSlots) {
      console.log(`❌ СЛИШКОМ МНОГО ФАЙЛОВ: выбрано ${files.length}, доступно ${totalSlots}`);
      if (totalSlots === 0) {
        alert('Достигнут лимит фотографий (максимум 3)');
      } else {
        alert(`Можно загрузить еще ${totalSlots} фото (выбрано ${files.length})`);
      }
      // Сбрасываем input при ошибке
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    const filesToProcess = Array.from(files).slice(0, totalSlots);
    console.log('Файлы для обработки:', filesToProcess.length);

    // Validate all files first
    console.log('=== ПРОВЕРКА ФАЙЛОВ ===');
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i];
      console.log(`Проверка файла ${i + 1}: ${file.name}`);
      
      if (!file.type.startsWith('image/')) {
        console.log(`❌ ФАЙЛ НЕ ИЗОБРАЖЕНИЕ: ${file.name}, тип: ${file.type}`);
        alert(`Файл "${file.name}" не является изображением`);
        // Сбрасываем input при ошибке
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      // Проверяем размер файла (максимум 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.log(`❌ ФАЙЛ СЛИШКОМ БОЛЬШОЙ: ${file.name}, размер: ${file.size} байт`);
        alert(`Файл "${file.name}" слишком большой (максимум 10MB)`);
        // Сбрасываем input при ошибке
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      
      console.log(`✅ ФАЙЛ ПРОШЕЛ ПРОВЕРКУ: ${file.name}`);
    }

    console.log('=== НАЧАЛО ЗАГРУЗКИ ===');
    setIsUploading(true);

    try {
      console.log('Создание промисов для загрузки файлов...');
      
      // Process all files and collect results
      const loadPromises = filesToProcess.map((file, index) => {
        console.log(`Создание промиса для файла ${index + 1}: ${file.name}`);
        
        return new Promise<string>((resolve, reject) => {
          console.log(`Начало чтения файла: ${file.name}`);
          
          const reader = new FileReader();
          
          reader.onload = (e) => {
            console.log(`✅ ФАЙЛ ПРОЧИТАН: ${file.name}`);
            const result = e.target?.result as string;
            if (result) {
              console.log(`✅ ФАЙЛ УСПЕШНО ЗАГРУЖЕН: ${file.name} (${file.size} bytes, результат: ${result.substring(0, 50)}...)`);
              resolve(result);
            } else {
              console.log(`❌ ПУСТОЙ РЕЗУЛЬТАТ: ${file.name}`);
              reject(new Error(`Failed to load file: ${file.name}`));
            }
          };
          
          reader.onerror = () => {
            console.error(`❌ ОШИБКА ЧТЕНИЯ ФАЙЛА: ${file.name}`, reader.error);
            const errorMessage = reader.error?.name === 'QuotaExceededError' 
              ? `Файл "${file.name}" слишком большой для обработки. Попробуйте уменьшить размер изображения.`
              : `Ошибка чтения файла ${file.name}`;
            reject(new Error(errorMessage));
          };
          
          reader.onabort = () => {
            console.error(`❌ ЧТЕНИЕ ПРЕРВАНО: ${file.name}`);
            reject(new Error(`Чтение файла прервано: ${file.name}`));
          };
          
          console.log(`Запуск readAsDataURL для файла: ${file.name}`);
          // Используем readAsDataURL для лучшей совместимости с Android и iPhone
          reader.readAsDataURL(file);
        });
      });

      console.log('Ожидание завершения всех промисов...');
      // Wait for all files to load and update state once
      const results = await Promise.all(loadPromises);
      console.log(`✅ ВСЕ ФАЙЛЫ ОБРАБОТАНЫ: ${results.length} файлов`);
      
      console.log('Обновление формы...');
      // Update form value directly
      const currentPhotos = form.getValues('photos') || [];
      const newPhotos = [...currentPhotos, ...results];
      console.log(`Старых фото: ${currentPhotos.length}, новых: ${results.length}, всего: ${newPhotos.length}`);
      
      form.setValue('photos', newPhotos);
      console.log('✅ ФОРМА ОБНОВЛЕНА');
      
    } catch (error) {
      console.error('❌ ОШИБКА В ПРОЦЕССЕ ЗАГРУЗКИ:', error);
      const errorMessage = error instanceof Error ? error.message : 'Неизвестная ошибка';
      alert(`Произошла ошибка при загрузке фотографий: ${errorMessage}`);
    } finally {
      console.log('Завершение загрузки...');
      setIsUploading(false);
    }

    // Reset file input - важно для Android и iPhone
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      console.log('✅ INPUT СБРОШЕН');
    }
    
    console.log('=== КОНЕЦ ОБРАБОТКИ ФАЙЛОВ ===');
  };

  // Обработчик для выбора файлов из галереи
  const handleFileInputClick = () => {
    console.log('=== КЛИК ПО КНОПКЕ ФОТО ===');
    console.log('fileInputRef.current:', fileInputRef.current);
    
    if (fileInputRef.current) {
      console.log('Сброс значения input...');
      // Сбрасываем значение перед кликом для Android и iPhone
      fileInputRef.current.value = '';
      console.log('Клик по input...');
      fileInputRef.current.click();
      console.log('Клик выполнен');
    } else {
      console.log('❌ fileInputRef.current НЕ НАЙДЕН');
    }
  };

  // Обработчик для случая, когда пользователь возвращается из галереи
  const handleFileInputFocus = () => {
    console.log('File input focused');
  };

  const handleFileInputBlur = () => {
    console.log('File input blurred');
  };

  // Обработчик для drag & drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    console.log('=== DROP EVENT ===');
    console.log('Dropped files:', e.dataTransfer.files);
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      // Создаем искусственное событие для обработки файлов
      const fakeEvent = {
        target: { files }
      } as React.ChangeEvent<HTMLInputElement>;
      
      handlePhotoUpload(fakeEvent);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleRemovePhoto = (index: number) => {
    const currentPhotos = form.getValues('photos') || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    form.setValue('photos', newPhotos);
  };

  const onSubmit = (data: OrderFormValues) => {
    console.log('Form data before submission:', data);
    
    // Простая отправка данных без дополнительных проверок
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
                Выберите фотографии из галереи (можно выбрать несколько одновременно)
              </p>
                            <FormControl>
                <div className="space-y-4">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handlePhotoUpload}
                                        onFocus={handleFileInputFocus}
                                        onBlur={handleFileInputBlur}
                                        className="hidden" 
                                        accept="image/*"
                                        multiple
                                        onTouchStart={(e) => {
                                          console.log('=== TOUCH START ===');
                                          e.preventDefault();
                                          console.log('Touch start on file input');
                                        }}
                                        onTouchEnd={(e) => {
                                          console.log('=== TOUCH END ===');
                                          console.log('Touch end on file input');
                                          setTimeout(() => {
                                            console.log('Выполнение handleFileInputClick после задержки...');
                                            handleFileInputClick();
                                          }, 100);
                                        }}
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
                      <div 
                        className="h-20 w-20 border-dashed border-2 border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                        onClick={handleFileInputClick}
                        onDrop={handleDrop}
                        onDragOver={handleDragOver}
                        style={{ 
                          background: 'linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)',
                          backgroundSize: '20px 20px',
                          backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
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
                            <span className="text-xs">Фото</span>
                            <span className="text-xs text-gray-500">или перетащите</span>
                          </>
                        )}
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
