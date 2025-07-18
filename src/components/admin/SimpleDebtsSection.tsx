'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Debt, User } from '@/lib/types';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { DollarSign, CreditCard, RefreshCw, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SimpleDebtsSectionProps {
  debts: Debt[];
  currentUser: Omit<User, 'password_hash'>;
  onDebtUpdate: () => void;
}

export function SimpleDebtsSection({ debts, currentUser, onDebtUpdate }: SimpleDebtsSectionProps) {
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
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
      onDebtUpdate();
      toast({
        title: 'Обновлено',
        description: 'Данные долгов обновлены.',
      });
    } catch (error) {
      console.error('Error refreshing debts:', error);
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
    
    toast({
      title: 'Функция в разработке',
      description: 'Функция погашения долгов будет доступна после создания таблиц.',
    });
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
    
    toast({
      title: 'Функция в разработке',
      description: 'История платежей будет доступна после создания таблиц.',
    });
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
              <Button
                onClick={handleInitializeDebts}
                disabled={isInitializing}
                variant="outline"
                size="sm"
              >
                <Database className="h-4 w-4 mr-2" />
                {isInitializing ? 'Создание...' : 'Создать таблицы'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debts.length > 0 ? (
              debts.map((debt) => (
                <Card key={debt.id} className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-lg">Долг кассы {debt.person_name}</h3>
                    <div className="flex items-center gap-2">
                      {debt.is_temporary && (
                        <Badge variant="secondary" className="text-xs">
                          Временный
                        </Badge>
                      )}
                      <Badge 
                        variant={debt.current_amount > 0 ? 'destructive' : 'success'}
                        className="text-sm"
                      >
                        {debt.current_amount > 0 ? 'Есть долг' : 'Нет долга'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-2xl font-bold text-red-600">
                      {debt.current_amount.toLocaleString('ru-RU')} ₽
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Последнее обновление: {format(new Date(debt.updated_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                    </p>
                    {debt.is_temporary && (
                      <p className="text-xs text-orange-600 mt-1">
                        * Рассчитано на основе расходов. Создайте таблицы долгов для полной функциональности.
                      </p>
                    )}
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
                      История
                    </Button>
                  </div>
                </Card>
              ))
            ) : (
              <div className="col-span-2 text-center py-8">
                <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Долги не найдены</h3>
                <p className="text-muted-foreground mb-4">
                  Нет расходов от Администратора или Максима для расчета долгов.
                </p>
                <Button onClick={handleRefreshDebts} variant="outline">
                  Обновить данные
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 