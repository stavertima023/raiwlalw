# Исправление проблемы с полями базы данных

## Проблема

**Ошибка Supabase**: `record "new" has no field "order_date"`

## Причина

Несоответствие форматов названий полей между фронтендом (camelCase) и базой данных Supabase (snake_case):

### Фронтенд использует camelCase:
- `orderDate`
- `orderNumber` 
- `shipmentNumber`
- `productType`

### База данных Supabase ожидает snake_case:
- `order_date`
- `order_number`
- `shipment_number`
- `product_type`

## Исправление

### 1. Преобразование данных при отправке в БД

В API `POST /api/orders` добавлено преобразование camelCase → snake_case:

```javascript
const supabaseOrderData = {
  order_date: validatedOrder.orderDate,
  order_number: validatedOrder.orderNumber,
  shipment_number: validatedOrder.shipmentNumber,
  status: validatedOrder.status,
  product_type: validatedOrder.productType,
  size: validatedOrder.size,
  seller: validatedOrder.seller,
  price: validatedOrder.price,
  cost: validatedOrder.cost,
  photos: validatedOrder.photos,
  comment: validatedOrder.comment,
};
```

### 2. Преобразование данных при получении из БД

В API `GET /api/orders` и `POST /api/orders` (ответ) добавлено преобразование snake_case → camelCase:

```javascript
const parsedData = data.map(item => ({
  id: item.id,
  orderDate: new Date(item.order_date || item.orderDate),
  orderNumber: item.order_number || item.orderNumber,
  shipmentNumber: item.shipment_number || item.shipmentNumber,
  status: item.status,
  productType: item.product_type || item.productType,
  size: item.size,
  seller: item.seller,
  price: item.price,
  cost: item.cost,
  photos: item.photos || [],
  comment: item.comment || '',
}));
```

## Тестирование

1. Попробуйте создать новый заказ
2. Проверьте логи в консоли браузера - должны отобразиться детальные логи процесса
3. Убедитесь, что заказ создается без ошибок

## Совместимость

Исправление обеспечивает совместимость с обоими форматами полей (snake_case и camelCase), используя оператор `||` для fallback значений. 