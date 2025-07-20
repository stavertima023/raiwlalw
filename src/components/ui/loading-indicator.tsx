import * as React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCacheStatus } from '@/lib/cache';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface LoadingIndicatorProps {
  isLoading: boolean;
  dataCount: number;
  dataType: string;
  showCacheStatus?: boolean;
}

export function LoadingIndicator({ 
  isLoading, 
  dataCount, 
  dataType, 
  showCacheStatus = true 
}: LoadingIndicatorProps) {
  const [cacheStatus, setCacheStatus] = React.useState(getCacheStatus());

  React.useEffect(() => {
    if (showCacheStatus) {
      setCacheStatus(getCacheStatus());
    }
  }, [showCacheStatus]);

  if (isLoading) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span className="text-sm text-muted-foreground">
                Загрузка {dataType}...
              </span>
            </div>
            {cacheStatus.isAvailable && (
              <Badge variant="outline" className="text-xs">
                Кэш доступен
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dataCount === 0) {
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {dataType} не найдены
            </span>
            {showCacheStatus && cacheStatus.isAvailable && cacheStatus.lastUpdate > 0 && (
              <Badge variant="secondary" className="text-xs">
                Обновлено {formatDistanceToNow(cacheStatus.lastUpdate, { 
                  addSuffix: true, 
                  locale: ru 
                })}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Загружено {dataCount} {dataType}
          </span>
          {showCacheStatus && cacheStatus.isAvailable && cacheStatus.lastUpdate > 0 && (
            <Badge variant="outline" className="text-xs">
              Кэш: {formatDistanceToNow(cacheStatus.lastUpdate, { 
                addSuffix: true, 
                locale: ru 
              })}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 