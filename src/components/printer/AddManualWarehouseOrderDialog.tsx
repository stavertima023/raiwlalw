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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ProductTypeEnum, SizeEnum } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus, X, Plus, ZoomIn } from 'lucide-react';
import Image from 'next/image';
import { safeImageToDataURL, cleanImageArray } from '@/lib/imageUtils';

const ManualWarehouseOrderSchema = z.object({
  productType: ProductTypeEnum,
  size: SizeEnum,
  photos: z.array(z.string()).max(2).optional().default([]),
  orderNumber: z.string().optional(),
  shipmentNumber: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  comment: z.string().optional().default(''),
});

type ManualWarehouseOrderFormValues = z.infer<typeof ManualWarehouseOrderSchema>;

type AddManualWarehouseOrderDialogProps = {
  onSuccess?: () => void;
};

export function AddManualWarehouseOrderDialog({ onSuccess }: AddManualWarehouseOrderDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const form = useForm<ManualWarehouseOrderFormValues>({
    resolver: zodResolver(ManualWarehouseOrderSchema),
    defaultValues: {
      productType: undefined,
      size: undefined,
      photos: [],
      orderNumber: '',
      shipmentNumber: '',
      price: undefined,
      comment: '',
    },
  });

  const photos = form.watch('photos') || [];

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    
    try {
      const filesToProcess = Array.from(files).slice(0, 2 - photos.length);
      const results: string[] = [];
      
      for (const file of filesToProcess) {
        try {
          const result = await safeImageToDataURL(file);
          if (result.success && result.dataUrl) {
            results.push(result.dataUrl);
          } else {
            console.warn(`Не удалось обработать файл ${file.name}:`, result.error);
          }
        } catch (fileError) {
          console.error(`Ошибка обработки файла ${file.name}:`, fileError);
        }
      }

      if (results.length > 0) {
        const cleanedResults = cleanImageArray(results);
        const currentPhotos = form.getValues('photos') || [];
        const newPhotos = [...currentPhotos, ...cleanedResults].slice(0, 2);
        form.setValue('photos', newPhotos);
        console.log(`Загружено изображений: ${cleanedResults.length}`);
      }
    } catch (error) {
      console.error('Ошибка загрузки фото:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось загрузить фотографии',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemovePhoto = (index: number) => {
    const currentPhotos = form.getValues('photos') || [];
    const newPhotos = currentPhotos.filter((_, i) => i !== index);
    form.setValue('photos', newPhotos);
  };

  const onSubmit = async (data: ManualWarehouseOrderFormValues) => {
    if (!data.productType || !data.size) {
      toast({
        title: 'Ошибка',
        description: 'Тип и размер обязательны',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/warehouse/manual-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productType: data.productType,
          size: data.size,
          photos: data.photos || [],
          orderNumber: data.orderNumber?.trim() || undefined,
          shipmentNumber: data.shipmentNumber?.trim() || undefined,
          price: data.price || undefined,
          comment: data.comment?.trim() || '',
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Ошибка добавления заказа на склад');
      }

      toast({
        title: 'Успешно',
        description: 'Заказ добавлен на склад',
      });

      form.reset();
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось добавить заказ на склад',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PackagePlus className="h-4 w-4 mr-2" />
          Добавить вручную
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Добавить заказ на склад вручную</DialogTitle>
          <DialogDescription>
            Заполните тип, размер и фото. Остальные поля необязательны.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="productType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Тип товара *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите тип" />
                      </SelectTrigger>
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
                  <FormLabel>Размер *</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите размер" />
                      </SelectTrigger>
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
              name="photos"
              render={() => (
                <FormItem>
                  <FormLabel>Фотографии (максимум 2)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handlePhotoUpload}
                        className="hidden"
                        accept="image/*"
                        multiple
                        disabled={photos.length >= 2 || isUploading}
                      />
                      <div className="flex gap-2">
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
                        {photos.length < 2 && (
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
              name="orderNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Номер заказа (необязательно)</FormLabel>
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
                  <FormLabel>Номер отправления (необязательно)</FormLabel>
                  <FormControl>
                    <Input placeholder="SHP-A1B2C3" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Цена (необязательно)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Цена"
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
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий (необязательно)</FormLabel>
                  <FormControl>
                    <Input placeholder="Комментарий" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
                Отмена
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Добавление...' : 'Добавить на склад'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
