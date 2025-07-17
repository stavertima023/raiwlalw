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
import { useToast } from '@/hooks/use-toast';
import type { Order } from '@/lib/types';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal } from 'lucide-react';

interface CancelOrderDialogProps {
  children: React.ReactNode;
  findOrder: (orderNumber: string) => Order | undefined;
  onConfirmCancel: (orderNumber: string) => void;
}

export function CancelOrderDialog({
  children,
  findOrder,
  onConfirmCancel,
}: CancelOrderDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [orderNumber, setOrderNumber] = React.useState('');
  const [foundOrder, setFoundOrder] = React.useState<Order | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const { toast } = useToast();

  const handleFindOrder = () => {
    setError(null);
    setFoundOrder(null);
    if (!orderNumber) {
      setError('Пожалуйста, введите номер заказа.');
      return;
    }
    const order = findOrder(orderNumber);
    if (order) {
        if (order.status === 'Добавлен' || order.status === 'Готов') {
            setFoundOrder(order);
        } else if (order.status === 'Отменен') {
            setError(`Заказ #${orderNumber} уже отменен.`);
        } else {
            setError(`Невозможно отменить заказ со статусом "${order.status}". Отмена доступна только для заказов со статусом "Добавлен" или "Готов".`);
        }
    } else {
      setError(`Заказ с номером "${orderNumber}" не найден.`);
    }
  };

  const handleConfirm = () => {
    if (foundOrder) {
      onConfirmCancel(foundOrder.orderNumber);
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
          <DialogTitle>Отмена заказа</DialogTitle>
          <DialogDescription>
            Введите номер заказа для его отмены. Статус будет изменен на "Отменен".
          </DialogDescription>
        </DialogHeader>
        
        {!foundOrder ? (
            <div className="space-y-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="order-number" className="text-right">
                    Номер заказа
                    </Label>
                    <Input
                    id="order-number"
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
                <AlertTitle>Подтвердите отмену</AlertTitle>
                <AlertDescription className="mt-2">
                    <p>Вы уверены, что хотите отменить следующий заказ?</p>
                    <ul className="mt-2 list-disc list-inside text-sm">
                        <li><strong>Номер:</strong> {foundOrder.orderNumber}</li>
                        <li><strong>Продавец:</strong> {foundOrder.seller}</li>
                        <li><strong>Тип:</strong> {foundOrder.productType}</li>
                        <li><strong>Цена:</strong> {foundOrder.price.toLocaleString('ru-RU')} ₽</li>
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
            <Button variant="destructive" onClick={handleConfirm}>Подтвердить отмену</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
