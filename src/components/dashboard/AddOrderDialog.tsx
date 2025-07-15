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
import { Order } from '@/lib/types';
import { PlusCircle } from 'lucide-react';

type AddOrderDialogProps = {
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate' | 'seller'>) => void;
};

export function AddOrderDialog({ onAddOrder }: AddOrderDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleSave = (formData: Omit<Order, 'id' | 'orderDate' | 'seller' | 'status' | 'photos' | 'shipmentNumber'>) => {
    const completeOrderData: Omit<Order, 'id' | 'orderDate' | 'seller'> = {
        ...formData,
        status: 'Добавлен',
        photos: [],
        shipmentNumber: ''
    };
    onAddOrder(completeOrderData);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Добавить заказ
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
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