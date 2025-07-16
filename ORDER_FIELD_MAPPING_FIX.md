# Исправление проблемы с полями базы данных

## Проблема

**Ошибка Supabase PGRST204**: `Could not find the 'order_date' column of 'orders' in the schema cache`

## Причина

Неправильное понимание схемы базы данных. Изначально думали, что Supabase использует snake_case, но на самом деле:

### Реальная структура таблицы в Supabase:
```sql
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "orderNumber" TEXT NOT NULL,
  "shipmentNumber" TEXT NOT NULL,
  status public.order_status NOT NULL,
  "productType" public.product_type NOT NULL,
  size public.size NOT NULL,
  seller TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost NUMERIC NULL,
  photos TEXT[] DEFAULT '{}',
  comment TEXT NULL
);
```

**Поля с кавычками используют camelCase**, а не snake_case!

## Исправление

### Отправка данных в БД - используем quoted camelCase:

```javascript
const supabaseOrderData = {
  "orderDate": validatedOrder.orderDate,
  "orderNumber": validatedOrder.orderNumber,
  "shipmentNumber": validatedOrder.shipmentNumber,
  status: validatedOrder.status,
  "productType": validatedOrder.productType,
  size: validatedOrder.size,
  seller: validatedOrder.seller,
  price: validatedOrder.price,
  cost: validatedOrder.cost,
  photos: validatedOrder.photos,
  comment: validatedOrder.comment,
};
```

### Получение данных из БД - данные уже в camelCase:

```javascript
const parsedData = data.map(item => ({
  ...item,
  orderDate: new Date(item.orderDate),
}));
```

## Ключевые выводы

1. **Поля в кавычках** в PostgreSQL/Supabase сохраняют регистр букв
2. **Поля без кавычек** автоматически преобразуются в lowercase
3. **Наша схема использует quoted camelCase**, поэтому нужно отправлять данные именно в таком формате
4. **Нет необходимости в преобразовании** между snake_case и camelCase

## Тестирование

1. Попробуйте создать новый заказ
2. Проверьте логи в консоли браузера
3. Заказ должен создаваться без ошибок PGRST204 