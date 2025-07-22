import useSWR, { mutate } from 'swr';
import { Order } from '@/lib/types';
import { optimizedFetcher } from '@/lib/cache';

interface OrdersResponse {
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface UseOrdersOptions {
  page?: number;
  limit?: number;
  status?: string;
  seller?: string;
  orderNumber?: string;
  includePhotos?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
}

export function useOrders(options: UseOrdersOptions = {}) {
  const {
    page = 1,
    limit = 50,
    status,
    seller,
    orderNumber,
    includePhotos = true,
    sortBy = 'orderDate',
    sortOrder = 'desc',
    enabled = true
  } = options;

  // Строим URL с параметрами
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('limit', limit.toString());
  if (status && status !== 'all') params.append('status', status);
  if (seller && seller !== 'all') params.append('seller', seller);
  if (orderNumber) params.append('orderNumber', orderNumber);
  if (!includePhotos) params.append('includePhotos', 'false');
  params.append('sortBy', sortBy);
  params.append('sortOrder', sortOrder);

  const url = enabled ? `/api/orders?${params.toString()}` : null;

  const { data, error, isLoading, mutate: mutateOrders } = useSWR<OrdersResponse>(
    url,
    optimizedFetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 5000,
      keepPreviousData: true,
    }
  );

  // Оптимистичное обновление при изменении статуса
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    if (!data) return;

    // Оптимистично обновляем локальное состояние
    const optimisticData = {
      ...data,
      data: data.data.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus as any }
          : order
      )
    };

    // Обновляем кэш
    mutate(url, optimisticData, false);

    try {
      // Отправляем запрос на сервер
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) {
        throw new Error('Ошибка обновления статуса');
      }

      // Обновляем данные с сервера
      mutate(url);
    } catch (error) {
      // В случае ошибки откатываем изменения
      mutate(url);
      throw error;
    }
  };

  // Оптимистичное добавление заказа
  const addOrder = async (newOrder: Omit<Order, 'id' | 'orderDate' | 'seller'>) => {
    if (!data) return;

    // Оптимистично добавляем заказ
    const optimisticOrder: Order = {
      ...newOrder,
      id: `temp-${Date.now()}`,
      orderDate: new Date(),
      seller: 'current-user', // будет заменено сервером
    };

    const optimisticData = {
      ...data,
      data: [optimisticOrder, ...data.data],
      pagination: {
        ...data.pagination,
        total: data.pagination.total + 1
      }
    };

    mutate(url, optimisticData, false);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder)
      });

      if (!response.ok) {
        throw new Error('Ошибка добавления заказа');
      }

      // Обновляем данные с сервера
      mutate(url);
    } catch (error) {
      // В случае ошибки откатываем изменения
      mutate(url);
      throw error;
    }
  };

  return {
    orders: data?.data || [],
    pagination: data?.pagination,
    isLoading,
    error,
    mutate: mutateOrders,
    updateOrderStatus,
    addOrder,
    hasNextPage: data?.pagination ? data.pagination.page < data.pagination.totalPages : false,
    hasPreviousPage: data?.pagination ? data.pagination.page > 1 : false,
  };
} 