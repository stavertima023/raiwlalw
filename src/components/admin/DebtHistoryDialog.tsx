'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Debt, DebtPayment } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { History, Receipt } from 'lucide-react';
import Image from 'next/image';

interface DebtHistoryDialogProps {
  debt: Debt;
  isOpen: boolean;
  onClose: () => void;
}

interface PaymentWithDebt extends DebtPayment {
  debts: {
    person_name: string;
  };
}

export function DebtHistoryDialog({ debt, isOpen, onClose }: DebtHistoryDialogProps) {
  const [payments, setPayments] = React.useState<PaymentWithDebt[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen && debt.id) {
      fetchPayments();
    }
  }, [isOpen, debt.id]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/debts/payments?debt_id=${debt.id}`);
      if (response.ok) {
        const data = await response.json();
        setPayments(data);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            История погашений - {debt.person_name}
          </DialogTitle>
          <DialogDescription>
            История всех погашений долга кассы {debt.person_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Текущий статус долга */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Текущий долг</h3>
                <p className="text-2xl font-bold text-red-600">
                  {debt.current_amount.toLocaleString('ru-RU')} ₽
                </p>
              </div>
              <Badge variant={debt.current_amount > 0 ? 'destructive' : 'success'}>
                {debt.current_amount > 0 ? 'Есть долг' : 'Нет долга'}
              </Badge>
            </div>
          </div>

          {/* История погашений */}
          <div>
            <h3 className="font-semibold mb-3">История погашений</h3>
            {loading ? (
              <div className="text-center py-8">Загрузка...</div>
            ) : payments.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Дата</TableHead>
                      <TableHead>Сумма погашения</TableHead>
                      <TableHead>Остаток после погашения</TableHead>
                      <TableHead>Обработал</TableHead>
                      <TableHead>Комментарий</TableHead>
                      <TableHead>Чек</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell className="whitespace-nowrap">
                          {payment.payment_date ? format(new Date(payment.payment_date), 'dd.MM.yyyy HH:mm', { locale: ru }) : '–'}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {payment.payment_amount.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell className="font-medium">
                          {payment.remaining_debt.toLocaleString('ru-RU')} ₽
                        </TableCell>
                        <TableCell>{payment.processed_by}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {payment.comment || '–'}
                        </TableCell>
                        <TableCell>
                          {payment.receipt_photo ? (
                            <div className="relative group">
                              <Image
                                src={payment.receipt_photo}
                                alt="Receipt"
                                width={40}
                                height={40}
                                className="rounded cursor-pointer"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                <Receipt className="h-4 w-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">Нет</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                История погашений пуста
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 