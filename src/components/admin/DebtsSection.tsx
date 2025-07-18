'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Debt, Expense, User } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DollarSign, TrendingDown, AlertTriangle } from 'lucide-react';
import { PayDebtDialog } from './PayDebtDialog';

interface DebtsSectionProps {
  debts: Debt[];
  expenses: Expense[];
  users: User[];
  onPayDebt: (debtId: string, amount: number, personName: string, comment?: string, receiptPhoto?: string) => void;
}

export function DebtsSection({ debts, expenses, users, onPayDebt }: DebtsSectionProps) {
  // Calculate total expenses for each responsible person
  const calculateTotalExpenses = (responsibleName: string) => {
    return expenses
      .filter(expense => {
        const responsibleUser = users.find(user => user.id === expense.responsible);
        return responsibleUser?.name === responsibleName;
      })
      .reduce((sum, expense) => sum + expense.amount, 0);
  };

  // Calculate current debt amounts
  const getCurrentDebtAmount = (debt: Debt) => {
    const expensesAmount = calculateTotalExpenses(debt.personName);
    return debt.baseAmount + expensesAmount;
  };

  const totalDebt = debts.reduce((sum, debt) => sum + getCurrentDebtAmount(debt), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Долги
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {debts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Долгов нет</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4">
              {debts.map((debt) => {
                const currentAmount = getCurrentDebtAmount(debt);
                const expensesAmount = calculateTotalExpenses(debt.personName);
                
                return (
                  <div key={debt.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">Долг кассы {debt.personName}:</h4>
                        <Badge variant={currentAmount > 0 ? "destructive" : "default"}>
                          {currentAmount.toLocaleString('ru-RU')} ₽
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>Базовая сумма: {debt.baseAmount.toLocaleString('ru-RU')} ₽</div>
                        <div>Расходы: +{expensesAmount.toLocaleString('ru-RU')} ₽</div>
                      </div>
                    </div>
                    {currentAmount > 0 && (
                      <PayDebtDialog
                        debt={debt}
                        currentAmount={currentAmount}
                        onPayDebt={onPayDebt}
                      >
                        <Button variant="outline" size="sm">
                          <TrendingDown className="h-4 w-4 mr-2" />
                          Погасить долг
                        </Button>
                      </PayDebtDialog>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Общий долг:</span>
                <Badge variant="destructive" className="text-lg">
                  {totalDebt.toLocaleString('ru-RU')} ₽
                </Badge>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 