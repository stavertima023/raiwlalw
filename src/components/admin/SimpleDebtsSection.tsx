'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Debt, User } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DollarSign, CreditCard, RefreshCw, Database, History, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { PayDebtDialog } from './PayDebtDialog';
import { DebtHistoryDialog } from './DebtHistoryDialog';

interface SimpleDebtsSectionProps {
  debts: Debt[];
  currentUser: Omit<User, 'password_hash'>;
  onDebtUpdate: () => void;
}

export function SimpleDebtsSection({ debts, currentUser, onDebtUpdate }: SimpleDebtsSectionProps) {
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [selectedDebt, setSelectedDebt] = React.useState<Debt | null>(null);
  const [showPayDialog, setShowPayDialog] = React.useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = React.useState(false);
  const { toast } = useToast();

  const handleInitializeDebts = async () => {
    setIsInitializing(true);
    try {
      const response = await fetch('/api/debts/init', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to initialize debts');
      }
      
      onDebtUpdate();
      toast({
        title: 'Успешно',
        description: 'Таблицы долгов созданы и инициализированы.',
      });
    } catch (error) {
      console.error('Error initializing debts:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось создать таблицы долгов.',
        variant: 'destructive',
      });
    } finally {
      setIsInitializing(false);
    }
  };

  const handleRefreshDebts = async () => {
    setIsRefreshing(true);
    try {
      console.log('🔄 Начинаем обновление долгов...');
      const response = await fetch('/api/debts/update', {
        method: 'POST',
      });
      
      console.log('📡 Ответ сервера:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Ошибка ответа:', errorText);
        throw new Error(`Failed to update debts: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log('✅ Результат обновления:', result);
      
      onDebtUpdate();
      const debtAmount = result.calculation.Тимофей || 0;
      const details = result.details;
      
      let description = `Остаток обновлен: ${debtAmount.toLocaleString('ru-RU')} ₽`;
      
      if (details) {
        description += ` (Расходы: ${details.totalExpenses?.toLocaleString('ru-RU') || 0} ₽, Платежи: ${details.totalPayments?.toLocaleString('ru-RU') || 0} ₽)`;
      }
      
      toast({
        title: 'Обновлено',
        description: description,
      });
    } catch (error) {
      console.error('❌ Error refreshing debts:', error);
      toast({
        title: 'Ошибка',
        description: 'Не удалось обновить данные долгов.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };



  const handlePayDebt = (debt: Debt) => {
    if (debt.is_temporary) {
      toast({
        title: 'Внимание',
        description: 'Сначала создайте таблицы долгов для полной функциональности.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedDebt(debt);
    setShowPayDialog(true);
  };

  const handleViewHistory = (debt: Debt) => {
    if (debt.is_temporary) {
      toast({
        title: 'Внимание',
        description: 'История платежей будет доступна после создания таблиц долгов.',
        variant: 'destructive',
      });
      return;
    }
    
    setSelectedDebt(debt);
    setShowHistoryDialog(true);
  };

  const handlePaymentSuccess = () => {
    setShowPayDialog(false);
    onDebtUpdate();
    toast({
      title: 'Успешно',
      description: 'Платеж по долгу зарегистрирован.',
    });
  };

  // Проверяем, есть ли реальные долги (не временные)
  const hasRealDebts = debts.some(debt => !debt.is_temporary);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Остаток
            </CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleRefreshDebts}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Обновление...' : 'Обновить'}
              </Button>
              {!hasRealDebts && (
                <Button
                  onClick={handleInitializeDebts}
                  disabled={isInitializing}
                  variant="outline"
                  size="sm"
                >
                  <Database className="h-4 w-4 mr-2" />
                  {isInitializing ? 'Создание...' : 'Создать таблицы'}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.length > 0 ? (
              debts.map((debt) => (
                <Card key={debt.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Остаток</h3>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant={debt.current_amount > 0 ? 'default' : 'success'}
                        className="text-sm"
                      >
                        {debt.current_amount > 0 ? 'Есть остаток' : 'Нет остатка'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-blue-600">
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
                      Платежи по долгу
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Остаток не найден</h3>
                <p className="text-muted-foreground mb-4">
                  Нет расходов для расчета остатка.
                </p>
                <Button onClick={handleRefreshDebts} variant="outline">
                  Обновить данные
                </Button>
              </div>
            )}
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