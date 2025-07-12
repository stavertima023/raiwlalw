'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, Controller } from 'react-hook-form';
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
  OrderStatusEnum,
  ProductTypeEnum,
  SizeEnum,
  Order,
} from '@/lib/types';
import { predictShipmentNumber } from '@/ai/flows/shipment-number-prediction';
import { Loader2, Wand2, Plus, X, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

type OrderFormData = z.infer<typeof OrderSchema>;

interface OrderFormProps {
  children: React.ReactNode;
  onSave: (data: Omit<Order, 'id' | 'orderDate'>) => void;
  currentUserRole: 'Продавец' | 'Принтовщик';
}

const STEPS = [
  { name: 'Тип изделия', fields: ['productType'] },
  { name: 'Номера', fields: ['orderNumber', 'shipmentNumber'] },
  { name: 'Цена', fields: ['price'] },
  { name: 'Размер', fields: ['size'] },
  { name: 'Фотографии', fields: ['photos'] },
  { name: 'Продавец', fields: ['seller'] },
  { name: 'Подтверждение' },
];

export function OrderForm({ children, onSave, currentUserRole }: OrderFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPredicting, setIsPredicting] = React.useState(false);
  const [currentStep, setCurrentStep] = React.useState(0);
  const { toast } = useToast();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema.omit({ id: true, orderDate: true })),
    defaultValues: {
      orderNumber: '',
      shipmentNumber: '',
      status: 'Добавлен',
      productType: undefined,
      size: undefined,
      seller: '',
      price: 0,
      cost: 0,
      photos: [],
    },
    mode: 'onChange',
  });

  const { trigger, getValues, watch, setValue } = form;
  const watchedValues = watch();

  const nextStep = async () => {
    const fields = STEPS[currentStep].fields;
    const output = await trigger(fields as (keyof OrderFormData)[], {
      shouldFocus: true,
    });

    if (!output) return;

    if (currentStep < STEPS.length - 1) {
      setCurrentStep((step) => step + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep((step) => step - 1);
    }
  };

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

  const onSubmit = (data: Omit<Order, 'id' | 'orderDate'>) => {
    onSave(data);
    form.reset();
    setCurrentStep(0);
    setIsOpen(false);
    toast({
      title: 'Заказ создан',
      description: `Заказ #${data.orderNumber} был успешно добавлен.`,
    });
  };

  const handleClose = () => {
     form.reset();
     setCurrentStep(0);
     setIsOpen(false);
  }

  if (currentUserRole !== 'Продавец') {
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
          <DialogTitle>Новый заказ (Шаг {currentStep + 1} из {STEPS.length})</DialogTitle>
          <DialogDescription>{STEPS[currentStep].name}</DialogDescription>
        </DialogHeader>

        <Progress value={((currentStep + 1) / STEPS.length) * 100} className="w-full" />
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="min-h-[300px] py-4">
              {/* Step 1: Product Type */}
              {currentStep === 0 && (
                <FormField
                  control={form.control}
                  name="productType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-lg font-semibold">Выберите тип изделия</FormLabel>
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
              )}

              {/* Step 2: Order & Shipment Number */}
              {currentStep === 1 && (
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
                            disabled={isPredicting || !watchedValues.seller || !watchedValues.productType}
                            aria-label="Predict shipment number"
                          >
                            {isPredicting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
              
              {/* Step 3: Price */}
              {currentStep === 2 && (
                 <div className="grid grid-cols-1">
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
              )}

              {/* Step 4: Size */}
              {currentStep === 3 && (
                <FormField
                  control={form.control}
                  name="size"
                  render={({ field }) => (
                     <FormItem>
                        <FormLabel className="text-lg font-semibold">Выберите размер</FormLabel>
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
              )}

              {/* Step 5: Photos */}
              {currentStep === 4 && (
                <FormField
                  control={form.control}
                  name="photos"
                  render={() => (
                     <FormItem>
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
              )}
               {/* Step 6: Seller */}
              {currentStep === 5 && (
                 <FormField
                  control={form.control}
                  name="seller"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Продавец (Telegram ID)</FormLabel>
                      <FormControl>
                        <Input placeholder="Имя или Telegram ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Step 7: Confirmation */}
              {currentStep === 6 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Проверьте данные заказа</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            <div className="font-semibold">Номер заказа:</div><div>{watchedValues.orderNumber}</div>
                            <div className="font-semibold">Номер отправления:</div><div>{watchedValues.shipmentNumber || 'Не указан'}</div>
                            <div className="font-semibold">Статус:</div><div><Badge variant="primary">{watchedValues.status}</Badge></div>
                            <div className="font-semibold">Тип изделия:</div><div>{watchedValues.productType}</div>
                            <div className="font-semibold">Размер:</div><div>{watchedValues.size}</div>
                            <div className="font-semibold">Продавец:</div><div>{watchedValues.seller}</div>
                            <div className="font-semibold">Цена:</div><div>{watchedValues.price?.toLocaleString('ru-RU')} ₽</div>
                            <div className="font-semibold">Дата заказа:</div><div>{format(new Date(), 'd MMM yyyy', { locale: ru })}</div>
                        </div>
                        <div className="font-semibold">Фотографии:</div>
                        <div className="flex items-center gap-2">
                        {watchedValues.photos.length > 0 ? watchedValues.photos.map((photo, index) => (
                            <Image
                                key={index}
                                src={photo}
                                alt={`Product photo ${index + 1}`}
                                width={80}
                                height={80}
                                className="rounded-md object-cover"
                            />
                        )) : <p className="text-sm text-muted-foreground">Нет фото</p>}
                        </div>
                    </CardContent>
                </Card>
              )}
            </div>
            
            <DialogFooter>
                <div className="flex justify-between w-full">
                    <div>
                        <Button type="button" variant="secondary" onClick={handleClose}>
                            Отмена
                        </Button>
                    </div>
                    <div className="flex gap-2">
                        {currentStep > 0 && (
                            <Button type="button" variant="outline" onClick={prevStep}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Назад
                            </Button>
                        )}
                        {currentStep < STEPS.length - 1 && (
                            <Button type="button" onClick={nextStep}>
                                Далее <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        )}
                        {currentStep === STEPS.length - 1 && (
                            <Button type="submit">
                                <Check className="mr-2 h-4 w-4" /> Сохранить заказ
                            </Button>
                        )}
                    </div>
                </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
