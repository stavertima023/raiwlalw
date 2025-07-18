'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Debt, DebtPayment } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { History, DollarSign, Calendar, User, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface DebtHistoryDialogProps {
  debt: Debt;
  isOpen: boolean;
  onClose: () => void;
}

export function DebtHistoryDialog({ debt, isOpen, onClose }: DebtHistoryDialogProps) {
  const [payments, setPayments] = React.useState<DebtPayment[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (isOpen && debt.id && !debt.is_temporary) {
      loadPaymentHistory();
    }
  }, [isOpen, debt.id, debt.is_temporary]);

  const loadPaymentHistory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/debts/payments?debtId=${debt.id}`);
      
      if (!response.ok) {
        throw new Error('Не удалось загрузить историю платежей');
      }
      
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error: any) {
      console.error('Error loading payment history:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось загрузить историю платежей.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalPaid = payments.reduce((sum, payment) => sum + payment.payment_amount, 0);
  const remainingDebt = debt.current_amount - totalPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История платежей - {debt.person_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Сводка */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {debt.current_amount.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-sm text-muted-foreground">Текущий долг</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {totalPaid.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-sm text-muted-foreground">Всего погашено</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {remainingDebt.toLocaleString('ru-RU')} ₽
              </div>
              <div className="text-sm text-muted-foreground">Остаток</div>
            </div>
          </div>

          {/* Список платежей */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2">Загрузка истории...</span>
              </div>
            ) : payments.length > 0 ? (
              <div className="space-y-3">
                {payments.map((payment) => (
                  <div key={payment.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-semibold text-lg">
                          {payment.payment_amount.toLocaleString('ru-RU')} ₽
                        </span>
                      </div>
                                             <Badge variant="outline" className="text-xs">
                         {payment.payment_date ? format(new Date(payment.payment_date), 'dd.MM.yyyy HH:mm', { locale: ru }) : 'Н/Д'}
                       </Badge>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-muted-foreground">
                       <div className="flex items-center gap-1">
                         <User className="h-3 w-3" />
                         <span>Обработал: {payment.processed_by}</span>
                       </div>
                       <div className="flex items-center gap-1">
                         <Calendar className="h-3 w-3" />
                         <span>Дата: {payment.payment_date ? format(new Date(payment.payment_date), 'dd.MM.yyyy', { locale: ru }) : 'Н/Д'}</span>
                       </div>
                    </div>
                    
                    {payment.comment && (
                      <div className="mt-2 flex items-start gap-1">
                        <MessageSquare className="h-3 w-3 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{payment.comment}</span>
                      </div>
                    )}
                    
                    {payment.receipt_photo && (
                      <div className="mt-3">
                        <Image
                          src={payment.receipt_photo}
                          alt="Фото чека"
                          width={100}
                          height={100}
                          className="rounded-md object-cover cursor-pointer"
                          onClick={() => window.open(payment.receipt_photo, '_blank')}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">История платежей пуста</h3>
                <p className="text-muted-foreground">
                  По этому долгу пока не было зарегистрировано платежей.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 