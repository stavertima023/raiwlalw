import { useState, useEffect, useCallback, useMemo } from 'react';
import { Order } from '@/lib/types';
import { cacheManager, getCacheStatus } from '@/lib/cache';

interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  seller?: string;
  orderNumber?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export const useOrders = (options: UseOrdersOptions = {}) => {
  const {
    page = 1,
    limit = 50,
    status,
    seller,
    orderNumber,
    sortBy = 'orderDate',
    sortOrder = 'desc'
  } = options;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<OrdersResponse['pagination'] | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Строим URL для запроса
  const buildUrl = useCallback(() => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      sortBy,
      sortOrder
    });

    if (status && status !== 'all') params.append('status', status);
    if (seller && seller !== 'all') params.append('seller', seller);
    if (orderNumber) params.append('orderNumber', orderNumber);

    return `/api/orders/paginated?${params.toString()}`;
  }, [page, limit, status, seller, orderNumber, sortBy, sortOrder]);

  // Загрузка данных
  const loadOrders = useCallback(async (url: string, useCache = true) => {
    try {
      setLoading(true);
      setError(null);

      // Пытаемся получить из кэша
      if (useCache) {
        const cached = cacheManager.get<OrdersResponse>(url);
        if (cached) {
          setOrders(cached.data);
          setPagination(cached.pagination);
          setLoading(false);
          return;
        }
      }

      // Загружаем с сервера
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Ошибка загрузки заказов');
      }

      const data: OrdersResponse = await response.json();
      
      // Сохраняем в кэш
      cacheManager.set(url, data);
      
      setOrders(data.data);
      setPagination(data.pagination);
      setLastSync(new Date().toISOString());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  }, []);

  // Загрузка изменений
  const loadChanges = useCallback(async () => {
    try {
      const lastSyncTime = cacheManager.getLastSync();
      if (!lastSyncTime) return;

      const response = await fetch(`/api/orders/changes?lastSync=${lastSyncTime}`);
      if (!response.ok) return;

      const { changes, timestamp } = await response.json();
      
      if (changes && changes.length > 0) {
        // Обновляем существующие заказы
        setOrders(prevOrders => {
          const updatedOrders = [...prevOrders];
          
          changes.forEach((change: Order) => {
            const index = updatedOrders.findIndex(order => order.id === change.id);
            if (index !== -1) {
              updatedOrders[index] = change;
            } else {
              updatedOrders.unshift(change);
            }
          });
          
          return updatedOrders;
        });
        
        cacheManager.setLastSync(timestamp);
        setLastSync(timestamp);
      }
    } catch (err) {
      console.warn('Ошибка загрузки изменений:', err);
    }
  }, []);

  // Обновление статуса заказа
  const updateOrderStatus = useCallback(async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления статуса');
      }

      const updatedOrder = await response.json();
      
      // Обновляем заказ в локальном состоянии
      setOrders(prevOrders => 
        prevOrders.map(order => 
          order.id === orderId ? { ...order, ...updatedOrder } : order
        )
      );

      // Очищаем кэш для принудительного обновления
      cacheManager.remove(buildUrl());
      
      return updatedOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка обновления статуса');
      throw err;
    }
  }, [buildUrl]);

  // Добавление нового заказа
  const addOrder = useCallback(async (orderData: Omit<Order, 'id' | 'orderDate' | 'seller'>) => {
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error('Ошибка добавления заказа');
      }

      const newOrder = await response.json();
      
      // Добавляем заказ в начало списка
      setOrders(prevOrders => [newOrder, ...prevOrders]);
      
      // Очищаем кэш
      cacheManager.remove(buildUrl());
      
      return newOrder;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка добавления заказа');
      throw err;
    }
  }, [buildUrl]);

  // Загрузка данных при изменении параметров
  useEffect(() => {
    const url = buildUrl();
    loadOrders(url);
  }, [buildUrl, loadOrders]);

  // Автоматическая синхронизация изменений
  useEffect(() => {
    const interval = setInterval(() => {
      loadChanges();
    }, 15000); // Каждые 15 секунд

    return () => clearInterval(interval);
  }, [loadChanges]);

  // Мемоизированные вычисления
  const ordersByStatus = useMemo(() => {
    const grouped = orders.reduce((acc, order) => {
      if (!acc[order.status]) {
        acc[order.status] = [];
      }
      acc[order.status].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
    
    return grouped;
  }, [orders]);

  const readyOrders = useMemo(() => {
    return orders
      .filter(order => order.status === 'Готов')
      .sort((a, b) => {
        if (!a.ready_at && !b.ready_at) return 0;
        if (!a.ready_at) return 1;
        if (!b.ready_at) return -1;
        return new Date(b.ready_at).getTime() - new Date(a.ready_at).getTime();
      });
  }, [orders]);

  return {
    orders,
    ordersByStatus,
    readyOrders,
    loading,
    error,
    pagination,
    lastSync,
    updateOrderStatus,
    addOrder,
    loadChanges,
    refresh: () => {
      cacheManager.remove(buildUrl());
      loadOrders(buildUrl(), false);
    },
    cacheStatus: getCacheStatus()
  };
}; 