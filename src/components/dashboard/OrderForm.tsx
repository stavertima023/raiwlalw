
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
  DialogClose,
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
import { useToast } from '@/hooks/use-toast';
import {
  OrderSchema,
  ProductTypeEnum,
  SizeEnum,
  Order,
  User,
} from '@/lib/types';
import { predictShipmentNumber } from '@/ai/flows/shipment-number-prediction';
import { Loader2, Wand2, Plus, X, Check } from 'lucide-react';
import Image from 'next/image';
import { ScrollArea } from '../ui/scroll-area';
import { Textarea } from '../ui/textarea';

type OrderFormData = z.infer<typeof OrderSchema>;

interface OrderFormProps {
  children: React.ReactNode;
  onSave: (data: Omit<Order, 'id' | 'orderDate'>) => void;
  currentUser: User;
}

export function OrderForm({ children, onSave, currentUser }: OrderFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPredicting, setIsPredicting] = React.useState(false);
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema.omit({ id: true, orderDate: true, cost: true })),
    defaultValues: {
      orderNumber: '',
      shipmentNumber: '',
      status: 'Добавлен',
      productType: undefined,
      size: undefined,
      seller: currentUser.telegramId,
      price: '' as any, // Set initial value to empty string
      photos: [],
      comment: '',
    },
    mode: 'onChange',
  });
  
  React.useEffect(() => {
    form.setValue('seller', currentUser.telegramId);
  }, [currentUser, form])

  const { getValues, watch, setValue } = form;
  const watchedValues = watch();

  const handlePredictShipment = async () => {
    const productType = getValues('productType');
    if (!productType) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description:
          'Пожалуйста, укажите тип продукта для предсказания.',
      });
      return;
    }
    setIsPredicting(true);
    try {
      const result = await predictShipmentNumber({ seller: currentUser.telegramId, productType });
      setValue('shipmentNumber', result.shipmentNumber, {
        shouldValidate: true,
      });
      toast({
        title: 'Успех',
        description: 'Номер отправления предсказан.',
      });
    } catch (error) {
      console.error('Prediction failed:', error);
      toast({
        variant: 'destructive',
        title: 'Ошибка предсказания',
        description: 'Не удалось предсказать номер отправления.',
      });
    } finally {
      setIsPredicting(false);
    }
  };
  
  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const currentPhotos = getValues('photos');
    const totalSlots = 3 - currentPhotos.length;

    if (files.length > totalSlots) {
        toast({
            variant: 'destructive',
            title: 'Слишком много файлов',
            description: `Вы можете загрузить еще ${totalSlots} фото.`,
        });
    }

    const filesToProcess = Array.from(files).slice(0, totalSlots);

    filesToProcess.forEach(file => {
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
            setValue('photos', [...getValues('photos'), result], { shouldValidate: true });
        };
        reader.readAsDataURL(file);
    });

    // Reset file input
    if(fileInputRef.current) {
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

  const onSubmit = (data: Omit<Order, 'id' | 'orderDate' | 'cost'>) => {
    const finalData = { ...data, cost: data.price / 2 };
    onSave(finalData);
    form.reset();
    setIsOpen(false);
    toast({
      title: 'Заказ создан',
      description: `Заказ #${data.orderNumber} был успешно добавлен.`,
    });
  };

  const handleClose = () => {
     form.reset();
     setIsOpen(false);
  }

  if (currentUser.role !== 'Продавец') {
    return <>{children}</>;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            handleClose();
        } else {
            setIsOpen(true);
        }
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Новый заказ</DialogTitle>
          <DialogDescription>Заполните все поля для создания нового заказа.</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <ScrollArea className="h-[60vh] pr-6">
                <div className="space-y-6">
                    <div className="space-y-4">
                        <FormField
                            control={form.control}
                            name="orderNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Номер заказа</FormLabel>
                                <FormControl>
                                <Input placeholder="ORD-001" {...field} />
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
                                    <Input placeholder="SHP-A1B2 (можно оставить пустым)" {...field} />
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
                                <FormLabel>Цена продажи</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="1500" {...field} />
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
                                <Textarea
                                  placeholder="Например, особенности заказа или пожелания"
                                  className="resize-none"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>

                    <FormField
                    control={form.control}
                    name="size"
                    render={({ field }) => (
                        <FormItem className="border-t pt-6">
                            <FormLabel className="text-base font-semibold">Размер</FormLabel>
                        <FormControl>
                            <div className="grid grid-cols-4 gap-2 pt-2">
                                {SizeEnum.options.map((s) => (
                                    <Button
                                    key={s}
                                    variant={field.value === s ? 'default' : 'outline'}
                                    onClick={() => field.onChange(s)}
                                    type="button"
                                    className="h-16 text-base"
                                    >
                                    {s}
                                    </Button>
                                ))}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />

                    <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                        <FormItem className="border-t pt-6">
                        <FormLabel className="text-base font-semibold">Тип изделия</FormLabel>
                        <FormControl>
                            <div className="grid grid-cols-3 gap-2 pt-2">
                                {ProductTypeEnum.options.map((pt) => (
                                    <Button
                                    key={pt}
                                    variant={field.value === pt ? 'default' : 'outline'}
                                    onClick={() => field.onChange(pt)}
                                    type="button"
                                    className="h-16 text-base"
                                    >
                                    {pt}
                                    </Button>
                                ))}
                            </div>
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                
                    <FormField
                        control={form.control}
                        name="photos"
                        render={() => (
                            <FormItem className="border-t pt-6">
                            <FormLabel>Фотографии (до 3)</FormLabel>
                            <FormControl>
                                <div className="flex flex-wrap items-center gap-2">
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        onChange={handlePhotoUpload}
                                        className="hidden" 
                                        accept="image/*"
                                        multiple
                                     />
                                    {watchedValues.photos.map((photo, index) => (
                                        <div key={index} className="relative group w-24 h-24 sm:w-28 sm:h-28">
                                            <Image
                                                src={photo}
                                                alt={`Product photo ${index + 1}`}
                                                width={112}
                                                height={112}
                                                className="rounded-md object-cover w-full h-full"
                                                data-ai-hint="product photo"
                                            />
                                            <Button
                                                type="button"
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => handleRemovePhoto(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {watchedValues.photos.length < 3 && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="h-24 w-24 sm:h-28 sm:w-28 border-dashed flex-shrink-0"
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
                    <Check className="mr-2 h-4 w-4" /> Сохранить заказ
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
