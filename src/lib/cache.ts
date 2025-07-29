import * as React from 'react';

/**
 * Система кэширования для оптимизации загрузки данных
 * Обеспечивает быструю загрузку и сохранение данных между сессиями
 * Оптимизирована для мобильных устройств
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
  MOBILE_OPTIMIZED: 'mobile_optimized',
} as const;

// Версия кэша для инвалидации при обновлениях
const CACHE_VERSION = '1.1.0';

// Время жизни кэша (в миллисекундах) - увеличены для стабильности
const CACHE_TTL = {
  ORDERS: 10 * 60 * 1000, // 10 минут (было 5)
  EXPENSES: 15 * 60 * 1000, // 15 минут (было 10)
  PAYOUTS: 10 * 60 * 1000, // 10 минут (было 5)
  DEBTS: 5 * 60 * 1000, // 5 минут (было 2)
  USERS: 60 * 60 * 1000, // 60 минут (было 30)
} as const;

// Определяем мобильное устройство
const isMobile = () => {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

interface CacheItem<T> {
  data: T;
  timestamp: number;
  version: string;
  mobileOptimized?: boolean;
}

interface CacheMetadata {
  lastUpdate: number;
  version: string;
  mobileOptimized?: boolean;
}

/**
 * Класс для управления кэшем с мобильной оптимизацией
 */
class CacheManager {
  public isAvailable: boolean;
  private isMobileDevice: boolean;

  constructor() {
    this.isAvailable = typeof window !== 'undefined' && 'localStorage' in window;
    this.isMobileDevice = isMobile();
  }

  /**
   * Сохраняет данные в кэш с мобильной оптимизацией
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL.ORDERS): void {
    if (!this.isAvailable) return;

    try {
      // Для мобильных устройств уменьшаем размер данных
      let optimizedData = data;
      if (this.isMobileDevice && Array.isArray(data)) {
        // Ограничиваем количество элементов для мобильных устройств
        const maxItems = key === 'orders' ? 200 : 100;
        optimizedData = (data as any[]).slice(0, maxItems) as T;
      }

      const cacheItem: CacheItem<T> = {
        data: optimizedData,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        mobileOptimized: this.isMobileDevice,
      };

      localStorage.setItem(key, JSON.stringify(cacheItem));
      
      // Обновляем метаданные
      this.updateMetadata();
    } catch (error) {
      console.warn('Ошибка сохранения в кэш:', error);
      // При ошибке очищаем кэш для освобождения памяти
      this.clear();
    }
  }

  /**
   * Получает данные из кэша с проверкой мобильной оптимизации
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

      // Проверяем совместимость мобильной оптимизации
      if (cacheItem.mobileOptimized !== this.isMobileDevice) {
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
   * Удаляет элемент из кэша
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
        if (key !== CACHE_KEYS.LAST_UPDATE && key !== CACHE_KEYS.CACHE_VERSION) {
          localStorage.removeItem(key);
        }
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
        mobileOptimized: this.isMobileDevice,
      };
      localStorage.setItem(CACHE_KEYS.LAST_UPDATE, JSON.stringify(metadata));
    } catch (error) {
      console.warn('Ошибка обновления метаданных:', error);
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
      
      // Проверяем версию и мобильную оптимизацию
      if (cacheItem.version !== CACHE_VERSION || cacheItem.mobileOptimized !== this.isMobileDevice) {
        return true;
      }

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
      return parsed.lastUpdate || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * Проверяет доступность памяти
   */
  checkMemoryUsage(): boolean {
    if (!this.isAvailable || typeof performance === 'undefined') return true;

    try {
      // Простая проверка производительности
      const start = performance.now();
      const testData = new Array(1000).fill('test');
      localStorage.setItem('memory_test', JSON.stringify(testData));
      localStorage.removeItem('memory_test');
      const end = performance.now();

      // Если операция занимает больше 50мс, считаем что память переполнена
      return (end - start) < 50;
    } catch (error) {
      // При ошибке очищаем кэш
      this.clear();
      return false;
    }
  }
}

// Создаем экземпляр кэш-менеджера
export const cacheManager = new CacheManager();

/**
 * Оптимизированный fetcher с улучшенной обработкой ошибок
 */
export const optimizedFetcher = async (url: string) => {
  const cacheKey = url.replace('/api/', '');
  
  // Проверяем доступность памяти
  if (!cacheManager.checkMemoryUsage()) {
    console.warn('⚠️ Низкая производительность памяти, очищаем кэш');
    cacheManager.clear();
  }

  // Пытаемся получить данные из кэша
  const cachedData = cacheManager.get(cacheKey);
  if (cachedData) {
    console.log(`📦 Данные загружены из кэша: ${cacheKey}`);
    return cachedData;
  }

  // Если кэша нет или он устарел, загружаем с сервера
  console.log(`🌐 Загрузка данных с сервера: ${cacheKey}`);
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 секунд таймаут

    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'max-age=60',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!res.ok) {
      const error = new Error(`HTTP ${res.status}: ${res.statusText}`);
      throw error;
    }
    
    const data = await res.json();
    
    // Сохраняем в кэш только если данные валидны
    if (data && (Array.isArray(data) || typeof data === 'object')) {
      cacheManager.set(cacheKey, data);
    }
    
    return data;
  } catch (error) {
    console.error(`❌ Ошибка загрузки ${cacheKey}:`, error);
    
    // Возвращаем кэшированные данные даже если они устарели
    const staleData = cacheManager.get(cacheKey, CACHE_TTL.ORDERS * 2);
    if (staleData) {
      console.log(`🔄 Возвращаем устаревшие данные из кэша: ${cacheKey}`);
      return staleData;
    }
    
    throw error;
  }
};

/**
 * Конфигурация SWR для максимальной стабильности на мобильных устройствах
 */
export const swrConfig = {
  revalidateOnFocus: false, // Не перезагружаем при фокусе
  revalidateOnReconnect: false, // НЕ перезагружаем при восстановлении соединения
  dedupingInterval: isMobile() ? 60000 : 30000, // Увеличиваем для мобильных
  errorRetryCount: isMobile() ? 0 : 1, // Отключаем повторы для мобильных
  errorRetryInterval: isMobile() ? 5000 : 2000, // Увеличиваем интервал для мобильных
  refreshInterval: 0, // ОТКЛЮЧАЕМ автообновление полностью
  refreshWhenHidden: false, // Не обновляем когда вкладка неактивна
  refreshWhenOffline: false, // Не обновляем когда нет интернета
  revalidateIfStale: false, // Не перезагружаем устаревшие данные автоматически
  revalidateOnMount: false, // НЕ перезагружаем при монтировании
  keepPreviousData: true, // Сохраняем предыдущие данные при обновлении
  onError: (error: Error) => {
    console.error('SWR Error:', error);
  },
  // Добавляем дополнительные настройки для стабильности
  shouldRetryOnError: false, // Не повторяем при ошибках
  focusThrottleInterval: 0, // Отключаем throttle для фокуса
  loadingTimeout: 10000, // Таймаут загрузки 10 секунд
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
    isAvailable: cacheManager.isAvailable,
    version: CACHE_VERSION,
    isMobile: isMobile(),
    memoryOk: cacheManager.checkMemoryUsage(),
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
  }, [key, ttl, fetcher]);

  return { data, loading, error };
}; 