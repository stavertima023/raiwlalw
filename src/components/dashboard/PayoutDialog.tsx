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
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Terminal, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { Order } from '@/lib/types';
import { ScrollArea } from '../ui/scroll-area';

interface PayoutDialogProps {
  children: React.ReactNode;
  findOrders: (orderNumbers: string[]) => Order[];
  onConfirmPayout: (orderNumbers: string[]) => void;
  currentUser?: { username: string; role: string };
}

interface ProcessedOrders {
  valid: Order[];
  invalid: { number: string; reason: string }[];
  notFound: string[];
}

export function PayoutDialog({
  children,
  findOrders,
  onConfirmPayout,
  currentUser,
}: PayoutDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [orderNumbersInput, setOrderNumbersInput] = React.useState('');
  const [processedOrders, setProcessedOrders] = React.useState<ProcessedOrders | null>(null);
  const [totalAmount, setTotalAmount] = React.useState(0);

  const handleProcessOrders = () => {
    const numbers = orderNumbersInput
      .split(/[\s,]+/)
      .map((n) => n.trim())
      .filter(Boolean);
    
    if (numbers.length === 0) {
        setProcessedOrders({ valid: [], invalid: [], notFound: [] });
        setTotalAmount(0);
        return;
    }

    const found = findOrders(numbers);
    const foundNumbers = found.map(o => o.orderNumber);

    const valid: Order[] = [];
    const invalid: { number: string; reason: string }[] = [];

    found.forEach(order => {
      // For sellers, check if order belongs to them
      if (currentUser?.role === 'Продавец' && order.seller !== currentUser.username) {
        invalid.push({ number: order.orderNumber, reason: 'не ваш заказ' });
        return;
      }

      if (order.status === 'Готов' || order.status === 'Отправлен') {
        valid.push(order);
      } else if (order.status === 'Исполнен') {
        invalid.push({ number: order.orderNumber, reason: 'уже исполнен' });
      } else if (order.status === 'Отменен') {
        invalid.push({ number: order.orderNumber, reason: 'отменен' });
      } else if (order.status === 'Возврат') {
        invalid.push({ number: order.orderNumber, reason: 'возврат' });
      } else {
         invalid.push({ number: order.orderNumber, reason: `статус "${order.status}"` });
      }
    });

    const notFound = numbers.filter(num => !foundNumbers.includes(num));
    
    setProcessedOrders({ valid, invalid, notFound });

    const total = valid.reduce((sum, order) => sum + order.price, 0);
    setTotalAmount(total);
  };

  const handleConfirm = () => {
    if (processedOrders && processedOrders.valid.length > 0) {
      const validOrderNumbers = processedOrders.valid.map(o => o.orderNumber);
      onConfirmPayout(validOrderNumbers);
      resetState();
    }
  };

  const resetState = () => {
    setIsOpen(false);
    setOrderNumbersInput('');
    setProcessedOrders(null);
    setTotalAmount(0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) {
            resetState();
        }
        setIsOpen(open);
    }}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Вывод оплаты</DialogTitle>
          <DialogDescription>
            Введите номера заказов через запятую или пробел для формирования выплаты.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <Label htmlFor="order-numbers">Номера заказов</Label>
          <Textarea
            id="order-numbers"
            value={orderNumbersInput}
            onChange={(e) => setOrderNumbersInput(e.target.value)}
            placeholder="ORD-001, ORD-002, ORD-003"
            rows={4}
          />
          <Button onClick={handleProcessOrders}>Проверить заказы</Button>
        </div>

        {processedOrders && (
          <div className="space-y-4">
            <h3 className="font-semibold">Результаты проверки:</h3>
            <ScrollArea className="h-48 w-full rounded-md border p-4">
                {processedOrders.valid.length > 0 && (
                    <div className="space-y-2">
                        <h4 className="flex items-center font-medium text-green-600"><CheckCircle className="mr-2 h-4 w-4" />Готовы к выплате ({processedOrders.valid.length}):</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {processedOrders.valid.map(o => <li key={o.id}>#{o.orderNumber} ({(o.price || 0).toLocaleString('ru-RU')} ₽)</li>)}
                        </ul>
                    </div>
                )}
                {processedOrders.invalid.length > 0 && (
                     <div className="space-y-2 mt-4">
                        <h4 className="flex items-center font-medium text-yellow-600"><AlertCircle className="mr-2 h-4 w-4" />Недоступны для выплаты ({processedOrders.invalid.length}):</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {processedOrders.invalid.map(o => <li key={o.number}>#{o.number} ({o.reason})</li>)}
                        </ul>
                    </div>
                )}
                 {processedOrders.notFound.length > 0 && (
                    <div className="space-y-2 mt-4">
                        <h4 className="flex items-center font-medium text-red-600"><XCircle className="mr-2 h-4 w-4" />Не найдены ({processedOrders.notFound.length}):</h4>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {processedOrders.notFound.map(num => <li key={num}>#{num}</li>)}
                        </ul>
                    </div>
                 )}
                 {processedOrders.valid.length === 0 && processedOrders.invalid.length === 0 && processedOrders.notFound.length === 0 && (
                    <p className="text-sm text-muted-foreground">Заказы по введенным номерам не найдены.</p>
                 )}
            </ScrollArea>
             {processedOrders.valid.length > 0 && (
                <Alert>
                    <Terminal className="h-4 w-4" />
                    <AlertTitle>Итоговая сумма к выплате</AlertTitle>
                    <AlertDescription className="mt-2 text-lg font-bold">
                        {(totalAmount || 0).toLocaleString('ru-RU')} ₽
                    </AlertDescription>
                </Alert>
             )}
          </div>
        )}

        <DialogFooter>
          <Button variant="secondary" onClick={resetState}>
            Закрыть
          </Button>
          <Button onClick={handleConfirm} disabled={!processedOrders || processedOrders.valid.length === 0}>
            Подтвердить выплату
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
