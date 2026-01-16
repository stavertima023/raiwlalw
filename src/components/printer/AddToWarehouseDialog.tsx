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
import { PackagePlus } from 'lucide-react';

type AddToWarehouseDialogProps = {
  onSuccess?: () => void;
};

export function AddToWarehouseDialog({ onSuccess }: AddToWarehouseDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [shipmentNumbers, setShipmentNumbers] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  // Обработка ввода для сканера штрих-кодов
  // Сканер обычно добавляет Enter после каждого кода
  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let value = e.target.value;
    
    // Если последний символ - перенос строки, заменяем на пробел для удобства
    // Но сохраняем возможность ввода через Enter
    setShipmentNumbers(value);
  };

  // Обработка нажатия Enter - не добавляем новую строку, а добавляем пробел
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      // Если Enter нажат без Shift, добавляем пробел вместо новой строки
      // Это удобно для сканера штрих-кодов
      e.preventDefault();
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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PackagePlus className="h-4 w-4 mr-2" />
          Пополнить склад
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
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
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>
              Отмена
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting || !shipmentNumbers.trim()}>
              {isSubmitting ? 'Отправка...' : 'Отправить заказы на склад'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
