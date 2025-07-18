'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Debt, DebtPayment, User } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DollarSign, CreditCard, History } from 'lucide-react';
import { PayDebtDialog } from './PayDebtDialog';
import { DebtHistoryDialog } from './DebtHistoryDialog';

interface DebtsSectionProps {
  debts: Debt[];
  currentUser: Omit<User, 'password_hash'>;
  onPaymentSuccess: () => void;
}

export function DebtsSection({ debts, currentUser, onPaymentSuccess }: DebtsSectionProps) {
  const [selectedDebt, setSelectedDebt] = React.useState<Debt | null>(null);
  const [showPayDialog, setShowPayDialog] = React.useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false);
  const [isInitializing, setIsInitializing] = React.useState(false);

  const handleInitializeDebts = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/debts/init', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize debts');
      }
      
      onPaymentSuccess(); // Обновляем данные
    } catch (error) {
      console.error('Error initializing debts:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const handlePayDebt = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowPayDialog(true);
  };

  const handleViewHistory = (debt: Debt) => {
    setSelectedDebt(debt);
    setShowHistoryDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayDialog(false);
    onPaymentSuccess();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Долги кассы
            </CardTitle>
            <Button
              onClick={handleInitializeDebts}
              disabled={isInitializing}
              variant="outline"
              size="sm"
            >
              {isInitializing ? 'Инициализация...' : 'Обновить долги'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.map((debt) => (
              <Card key={debt.id} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg">Долг кассы {debt.person_name}</h3>
                  <Badge 
                    variant={debt.current_amount > 0 ? 'destructive' : 'success'}
                    className="text-sm"
                  >
                    {debt.current_amount > 0 ? 'Есть долг' : 'Нет долга'}
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <div className="text-2xl font-bold text-red-600">
                    {debt.current_amount.toLocaleString('ru-RU')} ₽
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Последнее обновление: {format(new Date(debt.updated_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePayDebt(debt)}
                    disabled={debt.current_amount <= 0}
                    size="sm"
                    className="flex-1"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Погасить долг
                  </Button>
                  <Button
                    onClick={() => handleViewHistory(debt)}
                    variant="outline"
                    size="sm"
                  >
                    <History className="h-4 w-4 mr-2" />
                    История
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDebt && (
        <>
          <PayDebtDialog
            debt={selectedDebt}
            currentUser={currentUser}
            isOpen={showPayDialog}
            onClose={() => setShowPayDialog(false)}
            onSuccess={handlePaymentSuccess}
          />
          
          <DebtHistoryDialog
            debt={selectedDebt}
            isOpen={showHistoryDialog}
            onClose={() => setShowHistoryDialog(false)}
          />
        </>
      )}
    </div>
  );
} 