'use client';

import * as React from 'react';
import { Order, ProductType, Size } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { OrderForm } from './OrderForm';
import { Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mutate } from 'swr';

type EditOrderDialogProps = {
  order: Order;
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'success';
  buttonClassName?: string;
};

export function EditOrderDialog({ 
  order,
  buttonSize = 'icon',
  buttonVariant = 'outline',
  buttonClassName = '',
}: EditOrderDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const { toast } = useToast();

  const handleSave = async (formData: {
    orderNumber: string;
    shipmentNumber: string;
    productType: ProductType;
    size: Size;
    price: number;
    photos: string[];
    comment?: string;
  }) => {
    try {
      setIsSaving(true);
      const payload = {
        shipmentNumber: formData.shipmentNumber,
        productType: formData.productType,
        size: formData.size,
        photos: formData.photos || [],
        comment: formData.comment || '',
      };

      const response = await fetch(`/api/orders/${order.id}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let message = 'Не удалось сохранить изменения';
        try {
          const err = await response.json();
          message = err.message || err.error || message;
        } catch {}
        throw new Error(message);
      }

      const updatedOrder: Order = await response.json();

      // Оптимистично обновляем кэш заказов
      await mutate('/api/orders', (currentOrders: Order[] = []) =>
        currentOrders.map((o) => (o.id === order.id ? { ...o, ...updatedOrder } : o)), false);

      toast({
        title: 'Заказ обновлен',
        description: `Заказ #${order.orderNumber} успешно обновлен`,
      });
      setIsOpen(false);
    } catch (e: any) {
      toast({
        title: 'Ошибка',
        description: e?.message || 'Не удалось сохранить изменения',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size={buttonSize} variant={buttonVariant} className={buttonClassName} title="Редактировать">
          <Edit className="h-4 w-4" />
          <span className="sr-only">Редактировать</span>
        </Button>
      </DialogTrigger>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          // Предотвращаем автофокус и автовыделение первого поля (номер отправления)
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>Редактирование заказа</DialogTitle>
          <DialogDescription>
            Можно изменить только номер отправления, размер, тип, фото и комментарий
          </DialogDescription>
        </DialogHeader>
        <OrderForm 
          onSave={handleSave}
          initialData={{
            orderNumber: order.orderNumber,
            shipmentNumber: order.shipmentNumber || '',
            productType: order.productType as ProductType,
            size: order.size as Size,
            price: order.price,
            photos: order.photos || [],
            comment: order.comment || '',
          }}
          disabledFields={{ orderNumber: true, price: true }}
        />
        {isSaving && (
          <div className="text-sm text-muted-foreground">Сохранение...</div>
        )}
      </DialogContent>
    </Dialog>
  );
}



