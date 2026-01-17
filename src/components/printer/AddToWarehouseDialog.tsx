'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { PackagePlus, Search } from 'lucide-react';
import Image from 'next/image';
import type { Order } from '@/lib/types';

type AddToWarehouseDialogProps = {
  onSuccess?: () => void;
};

type CheckResult = {
  found: Order[];
  foundCount: number;
  notFound: string[];
  notFoundCount: number;
  requested: number;
};

export function AddToWarehouseDialog({ onSuccess }: AddToWarehouseDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [shipmentNumbers, setShipmentNumbers] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isChecking, setIsChecking] = React.useState(false);
  const [checkResult, setCheckResult] = React.useState<CheckResult | null>(null);
  const { toast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Обработка ввода для сканера штрих-кодов
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setShipmentNumbers(e.target.value);
  };

  // Обработка нажатия Enter - добавляем пробел, но НЕ закрываем диалог
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Предотвращаем закрытие диалога и добавляем пробел
      e.preventDefault();
      e.stopPropagation();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = shipmentNumbers;
      const newValue = value.substring(0, start) + ' ' + value.substring(end);
      setShipmentNumbers(newValue);
      
      // Устанавливаем курсор после пробела
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 1;
      }, 0);
    }
  };

  // Предотвращаем закрытие диалога при нажатии Enter в текстовом поле
  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.target instanceof HTMLTextAreaElement) {
      e.stopPropagation();
    }
  };

  const handleCheckOrders = async () => {
    if (!shipmentNumbers.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите номера отправлений',
        variant: 'destructive',
      });
      return;
    }

    setIsChecking(true);
    setCheckResult(null);
    try {
      const response = await fetch('/api/warehouse/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipmentNumbers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка проверки заказов');
      }

      setCheckResult(data);
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось проверить заказы',
        variant: 'destructive',
      });
    } finally {
      setIsChecking(false);
    }
  };

  const handleSubmit = async () => {
    if (!shipmentNumbers.trim()) {
      toast({
        title: 'Ошибка',
        description: 'Введите номера отправлений',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/warehouse/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shipmentNumbers }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка добавления на склад');
      }

      toast({
        title: 'Успешно',
        description: `Добавлено на склад: ${data.added} заказов${data.notFound && data.notFound.length > 0 ? `. Не найдено: ${data.notFound.length}` : ''}`,
      });

      setShipmentNumbers('');
      setCheckResult(null);
      setIsOpen(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось добавить заказы на склад',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Сбрасываем состояние при закрытии диалога
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setShipmentNumbers('');
      setCheckResult(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PackagePlus className="h-4 w-4 mr-2" />
          Пополнить склад
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto" onKeyDown={handleDialogKeyDown}>
        <DialogHeader>
          <DialogTitle>Пополнить склад</DialogTitle>
          <DialogDescription>
            Введите номера отправлений через пробел или с новой строки. Сканер штрих-кодов автоматически добавит пробел после каждого кода.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground mb-2 block">
              Номера отправлений:
            </label>
            <Textarea
              ref={textareaRef}
              value={shipmentNumbers}
              onChange={handleInput}
              onKeyDown={handleKeyDown}
              placeholder="P000415584864 5038455273 80512716759463&#10;Или каждый номер с новой строки"
              className="min-h-[150px] font-mono text-sm"
              autoFocus
            />
            <p className="text-xs text-muted-foreground mt-2">
              Можно вводить через пробел, запятую или с новой строки. Сканер штрих-кодов работает автоматически.
            </p>
          </div>

          {/* Результаты проверки */}
          {checkResult && (
            <div className="space-y-3 border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Результаты проверки:</h4>
                <div className="text-sm text-muted-foreground">
                  Найдено: {checkResult.foundCount} / {checkResult.requested}
                </div>
              </div>

              {/* Найденные заказы */}
              {checkResult.found.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-green-600">Найдено заказов:</div>
                  <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2">
                    {checkResult.found.map((order) => (
                      <div key={order.id} className="flex gap-3 p-3 border rounded bg-green-50">
                        <div className="flex-shrink-0">
                          {order.photos && order.photos.length > 0 ? (
                            <Image
                              src={order.photos[0]}
                              alt={`Фото заказа ${order.shipmentNumber}`}
                              width={120}
                              height={120}
                              className="rounded object-cover"
                              style={{ width: 120, height: 120 }}
                            />
                          ) : (
                            <div className="w-[120px] h-[120px] bg-gray-200 rounded flex items-center justify-center text-xs text-center p-2">
                              Нет фото
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="text-sm font-medium">
                            {order.shipmentNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {order.productType} {order.size}
                          </div>
                          {order.price && (
                            <div className="text-sm font-medium">
                              {order.price} ₽
                            </div>
                          )}
                          {order.comment && (
                            <div className="text-xs text-muted-foreground truncate" title={order.comment}>
                              {order.comment}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Не найденные заказы */}
              {checkResult.notFound.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-red-600">Не найдено:</div>
                  <div className="max-h-[200px] overflow-y-auto flex flex-wrap gap-2 pr-2">
                    {checkResult.notFound.map((number) => (
                      <div
                        key={number}
                        className="px-2 py-1 bg-red-100 border border-red-300 rounded text-sm font-mono text-red-700"
                      >
                        {number}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-between gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting || isChecking}>
              Отмена
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCheckOrders}
                disabled={isChecking || isSubmitting || !shipmentNumbers.trim()}
              >
                <Search className="h-4 w-4 mr-2" />
                {isChecking ? 'Проверка...' : 'Проверить заказы'}
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || isChecking || !shipmentNumbers.trim() || (checkResult && checkResult.foundCount === 0)}
              >
                {isSubmitting ? 'Отправка...' : 'Отправить заказы на склад'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
