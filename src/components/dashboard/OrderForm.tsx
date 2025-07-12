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
    },
    mode: 'onChange',
  });
  
  React.useEffect(() => {
    form.setValue('seller', currentUser.telegramId);
  }, [currentUser, form])

  const { getValues, watch, setValue } = form;
  const watchedValues = watch();

  const handlePredictShipment = async () => {
    const seller = getValues('seller');
    const productType = getValues('productType');
    if (!seller || !productType) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description:
          'Пожалуйста, укажите продавца и тип продукта для предсказания.',
      });
      return;
    }
    setIsPredicting(true);
    try {
      const result = await predictShipmentNumber({ seller, productType });
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

  const handleAddPhoto = () => {
    const photos = getValues('photos');
    if (photos.length < 3) {
      const newPhotos = [...photos, `https://placehold.co/400x400.png`];
      setValue('photos', newPhotos, { shouldValidate: true });
    }
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
                                <div className="flex items-center gap-2">
                                <FormControl>
                                    <Input placeholder="SHP-A1B2 (можно оставить пустым)" {...field} />
                                </FormControl>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={handlePredictShipment}
                                    disabled={isPredicting || !watchedValues.productType}
                                    aria-label="Predict shipment number"
                                >
                                    {isPredicting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                </Button>
                                </div>
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
                                <div className="flex items-center gap-2">
                                    {watchedValues.photos.map((photo, index) => (
                                        <div key={index} className="relative group">
                                            <Image
                                                src={photo}
                                                alt={`Product photo ${index + 1}`}
                                                width={100}
                                                height={100}
                                                className="rounded-md object-cover"
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
                                            className="h-24 w-24 border-dashed"
                                            onClick={handleAddPhoto}
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
