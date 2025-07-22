import * as React from 'react';

/**
 * Система кэширования для оптимизации загрузки данных
 * Обеспечивает быструю загрузку и сохранение данных между сессиями
 */

// Ключи для localStorage
const CACHE_KEYS = {
  ORDERS: 'orders_cache',
  EXPENSES: 'expenses_cache',
  PAYOUTS: 'payouts_cache',
  DEBTS: 'debts_cache',
  USERS: 'users_cache',
  LAST_UPDATE: 'last_update',
  CACHE_VERSION: 'cache_version',
  LAST_SYNC: 'last_sync',
} as const;

// Версия кэша для инвалидации при обновлениях
const CACHE_VERSION = '1.1.0';

// Время жизни кэша (в миллисекундах)
const CACHE_TTL = {
  ORDERS: 2 * 60 * 1000, // 2 минуты (уменьшено для быстрого обновления)
  EXPENSES: 10 * 60 * 1000, // 10 минут
  PAYOUTS: 5 * 60 * 1000, // 5 минут
  DEBTS: 2 * 60 * 1000, // 2 минуты
  USERS: 30 * 60 * 1000, // 30 минут
} as const;

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
}

interface CacheMetadata {
  lastUpdate: number;
  version: string;
}

/**
 * Класс для управления кэшем
 */
class CacheManager {
  public isAvailable: boolean;

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && 'localStorage' in window;
  }

  /**
   * Сохраняет данные в кэш
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.ORDERS): void {
    if (!this.isAvailable) return;

    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
      };

      localStorage.setItem(key, JSON.stringify(cacheItem));
      
      // Обновляем метаданные
      this.updateMetadata();
    } catch (error) {
      console.warn('Ошибка сохранения в кэш:', error);
    }
  }

  /**
   * Получает данные из кэша
   */
  get<T>(key: string, ttl: number = CACHE_TTL.ORDERS): T | null {
    if (!this.isAvailable) return null;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Проверяем версию кэша
      if (cacheItem.version !== CACHE_VERSION) {
        this.remove(key);
        return null;
      }

      // Проверяем время жизни кэша
      const isExpired = Date.now() - cacheItem.timestamp > ttl;
      if (isExpired) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('Ошибка чтения из кэша:', error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Удаляет данные из кэша
   */
  remove(key: string): void {
    if (!this.isAvailable) return;

    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.warn('Ошибка удаления из кэша:', error);
    }
  }

  /**
   * Очищает весь кэш
   */
  clear(): void {
    if (!this.isAvailable) return;

    try {
      Object.values(CACHE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (error) {
      console.warn('Ошибка очистки кэша:', error);
    }
  }

  /**
   * Обновляет метаданные кэша
   */
  private updateMetadata(): void {
    if (!this.isAvailable) return;

    try {
      const metadata: CacheMetadata = {
        lastUpdate: Date.now(),
        version: CACHE_VERSION,
      };

      localStorage.setItem(CACHE_KEYS.LAST_UPDATE, JSON.stringify(metadata));
      localStorage.setItem(CACHE_KEYS.CACHE_VERSION, CACHE_VERSION);
    } catch (error) {
      console.warn('Ошибка обновления метаданных кэша:', error);
    }
  }

  /**
   * Проверяет, нужно ли обновить кэш
   */
  shouldUpdate(key: string, ttl: number = CACHE_TTL.ORDERS): boolean {
    if (!this.isAvailable) return true;

    try {
      const cached = localStorage.getItem(key);
      if (!cached) return true;

      const cacheItem: CacheItem<any> = JSON.parse(cached);
      
      // Проверяем версию
      if (cacheItem.version !== CACHE_VERSION) return true;

      // Проверяем время жизни
      return Date.now() - cacheItem.timestamp > ttl;
    } catch (error) {
      return true;
    }
  }

  /**
   * Получает время последнего обновления
   */
  getLastUpdate(): number {
    if (!this.isAvailable) return 0;

    try {
      const metadata = localStorage.getItem(CACHE_KEYS.LAST_UPDATE);
      if (!metadata) return 0;

      const parsed: CacheMetadata = JSON.parse(metadata);
      return parsed.lastUpdate;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Сохраняет время последней синхронизации
   */
  setLastSync(timestamp: string): void {
    if (!this.isAvailable) return;

    try {
      localStorage.setItem(CACHE_KEYS.LAST_SYNC, timestamp);
    } catch (error) {
      console.warn('Ошибка сохранения времени синхронизации:', error);
    }
  }

  /**
   * Получает время последней синхронизации
   */
  getLastSync(): string | null {
    if (!this.isAvailable) return null;

    try {
      return localStorage.getItem(CACHE_KEYS.LAST_SYNC);
    } catch (error) {
      return null;
    }
  }
}

// Создаем глобальный экземпляр кэш-менеджера
export const cacheManager = new CacheManager();

/**
 * Оптимизированный fetcher с кэшированием
 */
export const optimizedFetcher = async (url: string) => {
  const cacheKey = url.replace('/api/', '');
  
  // Пытаемся получить данные из кэша
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    console.log(`📦 Данные загружены из кэша: ${cacheKey}`);
    return cachedData;
  }

  // Если кэша нет или он устарел, загружаем с сервера
  console.log(`🌐 Загрузка данных с сервера: ${cacheKey}`);
  
  const res = await fetch(url, {
    headers: {
      'Cache-Control': 'max-age=30',
    },
  });
  
  if (!res.ok) {
    const error = new Error('Произошла ошибка при загрузке данных');
    const info = await res.json();
    (error as any).info = info;
    throw error;
  }
  
  const data = await res.json();
  
  // Сохраняем в кэш
  cacheManager.set(cacheKey, data);
  
  return data;
};

/**
 * Fetcher для получения только изменений
 */
export const changesFetcher = async (url: string) => {
  const lastSync = cacheManager.getLastSync();
  const syncUrl = lastSync ? `${url}?lastSync=${lastSync}` : url;
  
  console.log(`🔄 Загрузка изменений: ${syncUrl}`);
  
  const res = await fetch(syncUrl, {
    headers: {
      'Cache-Control': 'no-cache',
    },
  });
  
  if (!res.ok) {
    const error = new Error('Произошла ошибка при загрузке изменений');
    const info = await res.json();
    (error as any).info = info;
    throw error;
  }
  
  const data = await res.json();
  
  // Обновляем время синхронизации
  if (data.timestamp) {
    cacheManager.setLastSync(data.timestamp);
  }
  
  return data;
};

/**
 * Конфигурация SWR для максимальной производительности
 */
export const swrConfig = {
  revalidateOnFocus: false, // Не перезагружаем при фокусе
  revalidateOnReconnect: true, // Перезагружаем при восстановлении соединения
  dedupingInterval: 5000, // Дедупликация запросов в течение 5 секунд (уменьшено)
  errorRetryCount: 2, // Повторяем ошибки только 2 раза
  errorRetryInterval: 1000, // Интервал между повторами
  refreshInterval: 15000, // Автообновление каждые 15 секунд (уменьшено)
  refreshWhenHidden: false, // Не обновляем когда вкладка неактивна
  refreshWhenOffline: false, // Не обновляем когда нет интернета
  revalidateIfStale: true, // Перезагружаем если данные устарели
  revalidateOnMount: true, // Перезагружаем при монтировании
};

/**
 * Функция для принудительного обновления кэша
 */
export const refreshCache = (key?: string) => {
  if (key) {
    cacheManager.remove(key);
  } else {
    cacheManager.clear();
  }
};

/**
 * Функция для получения статуса кэша
 */
export const getCacheStatus = () => {
  return {
    lastUpdate: cacheManager.getLastUpdate(),
    lastSync: cacheManager.getLastSync(),
    isAvailable: cacheManager.isAvailable,
    version: CACHE_VERSION,
  };
};

/**
 * Хук для работы с кэшированными данными
 */
export const useCache = <T>(key: string, fetcher: () => Promise<T>, ttl?: number) => {
  const [data, setData] = React.useState<T | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Пытаемся получить из кэша
        const cached = cacheManager.get<T>(key, ttl);
        if (cached) {
          setData(cached);
          setLoading(false);
          return;
        }

        // Загружаем с сервера
        const freshData = await fetcher();
        cacheManager.set(key, freshData, ttl);
        setData(freshData);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [key, ttl]);

  return { data, loading, error };
}; 