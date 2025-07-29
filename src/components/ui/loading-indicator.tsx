'use client';

import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Clock } from 'lucide-react';
import { cacheManager, getCacheStatus } from '@/lib/cache';
import { mutate } from 'swr';

interface LoadingIndicatorProps {
  isLoading?: boolean;
  dataCount?: number;
  dataType?: string;
  showCacheStatus?: boolean;
  onRefresh?: () => void;
}

export function LoadingIndicator({ 
  isLoading = false, 
  dataCount = 0, 
  dataType = 'данных',
  showCacheStatus = false,
  onRefresh
}: LoadingIndicatorProps) {
  const [cacheStatus, setCacheStatus] = React.useState(getCacheStatus());
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  // Обновляем статус кэша каждые 5 секунд
  React.useEffect(() => {
    if (!showCacheStatus) return;

    const interval = setInterval(() => {
      setCacheStatus(getCacheStatus());
    }, 5000);

    return () => clearInterval(interval);
  }, [showCacheStatus]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    console.log('🔄 Принудительное обновление данных...');
    
    try {
      // Очищаем кэш
      cacheManager.clear();
      
      // Принудительно обновляем все данные
      await Promise.all([
        mutate('/api/orders'),
        mutate('/api/expenses'),
        mutate('/api/payouts'),
        mutate('/api/debts'),
        mutate('/api/users'),
      ]);
      
      console.log('✅ Данные успешно обновлены');
      
      // Вызываем callback если предоставлен
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('❌ Ошибка при обновлении данных:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const formatLastUpdate = (timestamp: number) => {
    if (!timestamp) return 'Никогда';
    
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days} дн. назад`;
    if (hours > 0) return `${hours} ч. назад`;
    if (minutes > 0) return `${minutes} мин. назад`;
    return 'Только что';
  };

  if (!isLoading && dataCount === 0 && !showCacheStatus) {
    return null;
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <span className="text-sm text-muted-foreground">
                  Загрузка {dataType}...
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Database className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {dataCount} {dataType} загружено
                </span>
              </div>
            )}
          </div>
          
          {showCacheStatus && (
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Кэш: {formatLastUpdate(cacheStatus.lastUpdate)}</span>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center space-x-1"
              >
                <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Обновить</span>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 