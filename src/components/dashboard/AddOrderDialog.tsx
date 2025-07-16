'use client';

import * as React from 'react';
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
import { Order, ProductType, Size } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

type AddOrderDialogProps = {
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate' | 'seller'>) => void;
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
  buttonClassName?: string;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
};

export function AddOrderDialog({ 
  onAddOrder, 
  buttonSize = 'default',
  buttonClassName = '',
  buttonVariant = 'default'
}: AddOrderDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSave = (formData: {
    orderNumber: string;
    shipmentNumber: string;
    productType: ProductType;
    size: Size;
    price: number;
    photos: string[];
    comment?: string;
  }) => {
    const completeOrderData: Omit<Order, 'id' | 'orderDate' | 'seller'> = {
        ...formData,
        status: 'Добавлен',
        cost: Math.round(formData.price * 0.5), // Auto-calculate cost as 50% of price
    };
    onAddOrder(completeOrderData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button size={buttonSize} variant={buttonVariant} className={`${buttonClassName} whitespace-nowrap`}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Добавить заказ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Новый заказ</DialogTitle>
          <DialogDescription>
            Заполните все поля для создания нового заказа.
          </DialogDescription>
        </DialogHeader>
        <OrderForm onSave={handleSave} />
      </DialogContent>
    </Dialog>
  );
} 