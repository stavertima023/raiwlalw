'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Order } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

interface ReturnOrderDialogProps {
  children: React.ReactNode;
  findOrder: (orderNumber: string) => Order | undefined;
  onConfirmReturn: (orderNumber: string) => void;
}

export function ReturnOrderDialog({
  children,
  findOrder,
  onConfirmReturn,
}: ReturnOrderDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [orderNumber, setOrderNumber] = React.useState('');
  const [foundOrder, setFoundOrder] = React.useState<Order | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleFindOrder = () => {
    setError(null);
    if (!orderNumber) {
      setError('Пожалуйста, введите номер заказа.');
      return;
    }
    const order = findOrder(orderNumber);
    if (order) {
        if (order.status === 'Возврат') {
            setError(`По заказу #${orderNumber} уже оформлен возврат.`);
            setFoundOrder(null);
        } else if (order.status === 'Отменен') {
             setError(`Заказ #${orderNumber} был отменен и не может быть возвращен.`);
             setFoundOrder(null);
        } else {
            setFoundOrder(order);
        }
    } else {
      setError(`Заказ с номером "${orderNumber}" не найден.`);
      setFoundOrder(null);
    }
  };

  const handleConfirm = () => {
    if (foundOrder) {
      onConfirmReturn(foundOrder.orderNumber);
      resetState();
    }
  };
  
  const resetState = () => {
    setIsOpen(false);
    setOrderNumber('');
    setFoundOrder(null);
    setError(null);
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            resetState();
        }
        setIsOpen(open);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Оформление возврата</DialogTitle>
          <DialogDescription>
            Введите номер заказа для оформления возврата. Статус будет изменен на "Возврат".
          </DialogDescription>
        </DialogHeader>
        
        {!foundOrder ? (
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="order-number-return" className="text-right">
                    Номер заказа
                    </Label>
                    <Input
                    id="order-number-return"
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    className="col-span-3"
                    placeholder="ORD-001"
                    />
                </div>
                {error && <p className="text-sm text-destructive px-1">{error}</p>}
            </div>
        ) : (
            <Alert>
                <Terminal className="h-4 w-4" />
                <AlertTitle>Подтвердите возврат</AlertTitle>
                <AlertDescription className="mt-2">
                    <p>Вы уверены, что хотите оформить возврат для следующего заказа?</p>
                    <ul className="mt-2 list-disc list-inside text-sm">
                        <li><strong>Номер:</strong> {foundOrder.orderNumber}</li>
                        <li><strong>Продавец:</strong> {foundOrder.seller}</li>
                        <li><strong>Тип:</strong> {foundOrder.productType}</li>
                        <li><strong>Цена:</strong> {foundOrder.price.toLocaleString('ru-RU')} ₽</li>
                        <li><strong>Текущий статус:</strong> {foundOrder.status}</li>
                    </ul>
                </AlertDescription>
            </Alert>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={resetState}>
            Закрыть
          </Button>
          {!foundOrder ? (
             <Button onClick={handleFindOrder}>Найти заказ</Button>
          ) : (
            <Button variant="destructive" onClick={handleConfirm}>Подтвердить возврат</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
