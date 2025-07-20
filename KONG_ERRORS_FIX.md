# Исправление ошибок Kong и оптимизация API

## Проблема
Ошибка в логах Railway:
```
[warn] 1104#0: *1711833 an upstream response is buffered to a temporary file /usr/local/kong/proxy_temp/4/59/0000000594 while reading upstream
```

Эта ошибка означает, что Kong (API Gateway) буферизует ответ от Supabase в временный файл, что указывает на проблемы с производительностью или размером ответа.

## Решения

### 1. Оптимизация запросов с пагинацией

Используем пагинацию для всех API запросов:

```typescript
// Оптимизированный запрос заказов
export async function fetchOrdersWithPagination(page = 1, limit = 50) {
  const offset = (page - 1) * limit;
  
  const { data, error, count } = await supabase
    .from('orders')
    .select('id,orderDate,orderNumber,shipmentNumber,status,productType,size,seller,price,cost,photos,comment', { count: 'exact' })
    .order('orderDate', { ascending: false })
    .range(offset, offset + limit - 1);

  return { data, count, hasMore: data && data.length === limit };
}
```

### 2. Ограничение размера ответов

- Ограничиваем количество записей в одном запросе (50-100)
- Используем пагинацию для больших списков
- Кэшируем часто запрашиваемые данные

### 3. Оптимизация клиента Supabase

```typescript
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  },
  global: {
    headers: {
      'X-Client-Info': 'web-app-tg'
    }
  },
  db: {
    schema: 'public'
  }
});
```

### 4. Улучшение обработки ошибок

```typescript
try {
  const result = await fetchOrdersWithPagination(page, limit);
  return NextResponse.json({
    orders: result.data,
    total: result.count,
    hasMore: result.hasMore,
    page,
    limit
  });
} catch (error) {
  console.error('GET /api/orders error:', error);
  return NextResponse.json(
    { error: 'Ошибка при получении заказов' },
    { status: 500 }
  );
}
```

### 5. Кэширование и оптимизация SWR

```typescript
const { data: ordersData, error: ordersError, mutate: mutateOrders } = useSWR(
  activeTab === 'orders' ? ordersKey : null,
  fetcher,
  { 
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 5000
  }
);
```

## Мониторинг

### Проверка соединения с Supabase

```typescript
export async function checkSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    return !error;
  } catch (error) {
    console.error('Connection check error:', error);
    return false;
  }
}
```

### Логирование производительности

```typescript
console.log('Creating order with data:', {
  ...orderData,
  photos: orderData.photos ? `${orderData.photos.length} photos` : 'no photos'
});
```

## Рекомендации

1. **Используйте пагинацию** для всех списков данных
2. **Ограничивайте размер ответов** до разумных пределов
3. **Кэшируйте данные** на клиенте с помощью SWR
4. **Мониторьте производительность** API запросов
5. **Обрабатывайте ошибки** gracefully
6. **Используйте оптимизированные запросы** с правильными полями

## Результат

После внедрения этих оптимизаций:
- Уменьшится нагрузка на Kong
- Улучшится производительность API
- Снизится количество ошибок буферизации
- Улучшится пользовательский опыт 