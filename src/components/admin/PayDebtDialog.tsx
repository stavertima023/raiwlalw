'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Debt, User } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Loader2, DollarSign } from 'lucide-react';

interface PayDebtDialogProps {
  debt: Debt;
  currentUser: Omit<User, 'password_hash'>;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function PayDebtDialog({ debt, currentUser, isOpen, onClose, onSuccess }: PayDebtDialogProps) {
  const [paymentAmount, setPaymentAmount] = React.useState('');
  const [comment, setComment] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Ошибка',
        description: 'Введите корректную сумму платежа.',
        variant: 'destructive',
      });
      return;
    }

    if (amount > debt.current_amount) {
      toast({
        title: 'Ошибка',
        description: 'Сумма платежа не может превышать текущий долг.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/debts/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          debtId: debt.id,
          paymentAmount: amount,
          comment: comment.trim() || undefined,
          processedBy: currentUser.username,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Ошибка при создании платежа');
      }

      toast({
        title: 'Успешно',
        description: `Платеж на сумму ${amount.toLocaleString('ru-RU')} ₽ зарегистрирован.`,
      });

      onSuccess();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать платеж.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setPaymentAmount('');
      setComment('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Погашение долга {debt.person_name}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-debt">Текущий долг</Label>
            <Input
              id="current-debt"
              value={`${debt.current_amount.toLocaleString('ru-RU')} ₽`}
              disabled
              className="font-semibold text-red-600"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-amount">Сумма платежа *</Label>
            <Input
              id="payment-amount"
              type="number"
              step="0.01"
              min="0.01"
              max={debt.current_amount}
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              placeholder="Введите сумму платежа"
              required
            />
            <p className="text-xs text-muted-foreground">
              Максимальная сумма: {debt.current_amount.toLocaleString('ru-RU')} ₽
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="comment">Комментарий (необязательно)</Label>
            <Textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Дополнительная информация о платеже"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Отмена
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !paymentAmount}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Обработка...
                </>
              ) : (
                <>
                  <DollarSign className="h-4 w-4 mr-2" />
                  Зарегистрировать платеж
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 