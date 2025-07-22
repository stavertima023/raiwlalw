import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Database, Zap, RefreshCw } from 'lucide-react';

interface LoadingStatusProps {
  loading: boolean;
  dataCount: number;
  dataType: string;
  cacheStatus?: {
    lastUpdate: number;
    lastSync: string | null;
    isAvailable: boolean;
    version: string;
  };
  showCacheStatus?: boolean;
  onRefresh?: () => void;
}

export const LoadingStatus: React.FC<LoadingStatusProps> = ({
  loading,
  dataCount,
  dataType,
  cacheStatus,
  showCacheStatus = false,
  onRefresh
}) => {
  const getTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}ч ${minutes % 60}м назад`;
    if (minutes > 0) return `${minutes}м ${seconds % 60}с назад`;
    return `${seconds}с назад`;
  };

  const getPerformanceColor = (count: number) => {
    if (count < 100) return 'text-green-600';
    if (count < 500) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-4">
      {/* Основной статус загрузки */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              {loading ? (
                <RefreshCw className="h-5 w-5 animate-spin" />
              ) : (
                <Database className="h-5 w-5" />
              )}
              Статус загрузки
            </CardTitle>
            <Badge variant={loading ? 'secondary' : 'default'}>
              {loading ? 'Загрузка...' : 'Готово'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Загружено {dataType}:</span>
              <span className={`font-semibold ${getPerformanceColor(dataCount)}`}>
                {dataCount.toLocaleString()}
              </span>
            </div>
            
            {loading && (
              <Progress value={undefined} className="w-full" />
            )}
            
            {!loading && dataCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Zap className="h-4 w-4" />
                <span>
                  Производительность: {dataCount < 100 ? 'Отличная' : dataCount < 500 ? 'Хорошая' : 'Требует оптимизации'}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Статус кэша */}
      {showCacheStatus && cacheStatus && (
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Database className="h-5 w-5" />
              Кэш
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Последнее обновление:</span>
                <span className="text-sm font-medium">
                  {cacheStatus.lastUpdate > 0 ? getTimeAgo(cacheStatus.lastUpdate) : 'Нет данных'}
                </span>
              </div>
              
              {cacheStatus.lastSync && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Последняя синхронизация:</span>
                  <span className="text-sm font-medium">
                    {getTimeAgo(new Date(cacheStatus.lastSync).getTime())}
                  </span>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Статус кэша:</span>
                <Badge variant={cacheStatus.isAvailable ? 'default' : 'destructive'}>
                  {cacheStatus.isAvailable ? 'Доступен' : 'Недоступен'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Версия кэша:</span>
                <span className="text-sm font-mono">{cacheStatus.version}</span>
              </div>
              
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="w-full mt-2 px-3 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Обновить данные
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Рекомендации по производительности */}
      {!loading && dataCount > 500 && (
        <Card className="border-l-4 border-l-yellow-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Рекомендации
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p className="text-muted-foreground">
                Обнаружено большое количество {dataType} ({dataCount.toLocaleString()}). 
                Для улучшения производительности рекомендуется:
              </p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-4">
                <li>Использовать фильтры для уменьшения объема данных</li>
                <li>Включить пагинацию для больших списков</li>
                <li>Регулярно очищать старые записи</li>
                <li>Оптимизировать запросы к базе данных</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}; 