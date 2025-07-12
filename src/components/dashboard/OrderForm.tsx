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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  OrderSchema,
  OrderStatusEnum,
  ProductTypeEnum,
  SizeEnum,
  Order,
} from '@/lib/types';
import { predictShipmentNumber } from '@/ai/flows/shipment-number-prediction';
import { Loader2, Wand2, Plus, X } from 'lucide-react';
import Image from 'next/image';

type OrderFormData = z.infer<typeof OrderSchema>;

interface OrderFormProps {
  children: React.ReactNode;
  onSave: (data: Omit<Order, 'id' | 'orderDate'>) => void;
}

export function OrderForm({ children, onSave }: OrderFormProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPredicting, setIsPredicting] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<OrderFormData>({
    resolver: zodResolver(OrderSchema.omit({ id: true, orderDate: true })),
    defaultValues: {
      orderNumber: '',
      shipmentNumber: '',
      status: 'Добавлен',
      productType: 'фб',
      size: 'M',
      seller: '',
      price: 0,
      cost: 0,
      photos: [],
    },
  });

  const seller = form.watch('seller');
  const productType = form.watch('productType');
  const photos = form.watch('photos', []);

  const handlePredictShipment = async () => {
    if (!seller || !productType) {
      toast({
        variant: 'destructive',
        title: 'Ошибка',
        description: 'Пожалуйста, укажите продавца и тип продукта для предсказания.',
      });
      return;
    }
    setIsPredicting(true);
    try {
      const result = await predictShipmentNumber({ seller, productType });
      form.setValue('shipmentNumber', result.shipmentNumber, {
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
    if (photos.length < 3) {
      const newPhotos = [...photos, `https://placehold.co/400x400.png`];
      form.setValue('photos', newPhotos, { shouldValidate: true });
    }
  };

  const handleRemovePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    form.setValue('photos', newPhotos, { shouldValidate: true });
  };


  const onSubmit = (data: Omit<Order, 'id' | 'orderDate'>) => {
    onSave(data);
    form.reset();
    setIsOpen(false);
     toast({
      title: 'Заказ создан',
      description: `Заказ #${data.orderNumber} был успешно добавлен.`,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Новый заказ</DialogTitle>
          <DialogDescription>
            Заполните детали для создания нового заказа.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <ScrollArea className="max-h-[65vh] p-1 pr-6">
              <div className="space-y-4 p-4">
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
                          <Input placeholder="SHP-A1B2" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handlePredictShipment}
                          disabled={isPredicting || !seller || !productType}
                          aria-label="Predict shipment number"
                        >
                          {isPredicting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Wand2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Статус</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите статус" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OrderStatusEnum.options.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="productType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Тип изделия</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите тип" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ProductTypeEnum.options.map((pt) => (
                              <SelectItem key={pt} value={pt}>{pt}</SelectItem>
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
                            <SelectTrigger>
                              <SelectValue placeholder="Выберите размер" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SizeEnum.options.map((s) => (
                              <SelectItem key={s} value={s}>{s}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="seller"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Продавец</FormLabel>
                      <FormControl>
                        <Input placeholder="Имя или Telegram ID" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    name="cost"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Себестоимость</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="750" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                 <FormField
                  control={form.control}
                  name="photos"
                  render={() => (
                     <FormItem>
                        <FormLabel>Фотографии (до 3)</FormLabel>
                        <FormControl>
                           <div className="flex items-center gap-2">
                               {photos.map((photo, index) => (
                                 <div key={index} className="relative group">
                                     <Image
                                        src={photo}
                                        alt={`Product photo ${index + 1}`}
                                        width={80}
                                        height={80}
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
                               {photos.length < 3 && (
                                   <Button
                                       type="button"
                                       variant="outline"
                                       className="h-20 w-20 border-dashed"
                                       onClick={handleAddPhoto}
                                   >
                                       <Plus className="h-6 w-6 text-muted-foreground" />
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
            <DialogFooter className="pr-6 pb-2 pt-4">
              <DialogClose asChild>
                <Button type="button" variant="secondary">Отмена</Button>
              </DialogClose>
              <Button type="submit">Сохранить заказ</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
