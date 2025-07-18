'use client';

import * as React from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { DebtPayment } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { History, Receipt } from 'lucide-react';

interface DebtPaymentsHistoryProps {
  payments: DebtPayment[];
}

export function DebtPaymentsHistory({ payments }: DebtPaymentsHistoryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          История погашений долгов
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>История погашений пуста</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Кому погашен</TableHead>
                <TableHead>Сумма</TableHead>
                <TableHead>Комментарий</TableHead>
                <TableHead>Чек</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    {format(new Date(payment.createdAt || new Date()), 'd MMM yyyy, HH:mm', { locale: ru })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{payment.personName}</Badge>
                  </TableCell>
                  <TableCell className="font-semibold whitespace-nowrap">
                    {payment.amount.toLocaleString('ru-RU')} ₽
                  </TableCell>
                  <TableCell className="min-w-[200px] max-w-[400px] whitespace-pre-wrap break-words">
                    {payment.comment || '–'}
                  </TableCell>
                  <TableCell>
                    {payment.receiptPhoto ? (
                      <Dialog>
                        <DialogTrigger asChild>
                          <button>
                            <Image
                              src={payment.receiptPhoto}
                              alt="Фото чека"
                              width={40}
                              height={40}
                              className="rounded-md object-cover cursor-pointer"
                            />
                          </button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-2 sm:max-w-lg md:max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Фото чека погашения</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center">
                            <Image
                              src={payment.receiptPhoto}
                              alt="Фото чека"
                              width={800}
                              height={800}
                              className="rounded-md object-contain max-h-[80vh]"
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    ) : (
                      <div className="rounded-md bg-muted flex items-center justify-center text-muted-foreground text-xs h-10 w-10">
                        Нет
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
} 