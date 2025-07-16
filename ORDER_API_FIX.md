# 🔧 Исправление API создания заказов

## 🚨 Проблема
Ошибка 500 при создании заказов продавцами:
```
Failed to load resource: the server responded with a status of 500
Order creation failed: Object
```

## ✅ Исправления

### 1. **Добавлен обязательный статус по умолчанию**
```typescript
// src/app/api/orders/route.ts
const newOrderData = {
  ...json,
  seller: user.username,
  orderDate: new Date().toISOString(),
  status: 'Добавлен', // ✅ Добавлен статус по умолчанию
};
```

### 2. **Исправлена схема для опциональных полей**
```typescript
// src/lib/types.ts
export const OrderSchema = z.object({
  // ... другие поля
  cost: z.coerce.number().positive().nullable().optional(), // ✅ Может быть null
  photos: z.array(z.string()).max(3).optional().default([]), // ✅ По умолчанию []
  comment: z.string().optional().default(''), // ✅ По умолчанию ''
});
```

### 3. **Добавлена обработка отсутствующих полей**
```typescript
// src/app/api/orders/route.ts
const newOrderData = {
  ...json,
  seller: user.username,
  orderDate: new Date().toISOString(),
  status: 'Добавлен',
  cost: json.cost || null, // ✅ Безопасная обработка
  photos: json.photos || [], // ✅ Гарантируем массив
  comment: json.comment || '', // ✅ Гарантируем строку
};
```

### 4. **Улучшено логирование для отладки**
```typescript
try {
  const validatedOrder = OrderSchema.omit({ id: true }).parse(newOrderData);
  console.log('Validated order successfully:', validatedOrder);
} catch (validationError) {
  console.error('Validation failed:', validationError);
  throw validationError;
}
```

## 🎯 Результат

### Теперь API правильно обрабатывает:
- ✅ **Обязательные поля:** orderNumber, shipmentNumber, productType, size, price
- ✅ **Автоматические поля:** seller (из сессии), orderDate (текущая), status ('Добавлен')
- ✅ **Опциональные поля:** cost (null), photos ([]), comment ('')

### Форма заказа отправляет:
```json
{
  "orderNumber": "WB-12345",
  "shipmentNumber": "SP-67890", 
  "productType": "фб",
  "size": "M",
  "price": 1500,
  "photos": ["data:image/..."],
  "comment": "Комментарий клиента"
}
```

### API добавляет:
```json
{
  "orderNumber": "WB-12345",
  "shipmentNumber": "SP-67890",
  "productType": "фб", 
  "size": "M",
  "price": 1500,
  "photos": ["data:image/..."],
  "comment": "Комментарий клиента",
  "seller": "user123", // ✅ Из сессии
  "orderDate": "2024-01-15T10:30:00.000Z", // ✅ Автоматически
  "status": "Добавлен", // ✅ По умолчанию
  "cost": null // ✅ Для админа позже
}
```

## 🧪 Тестирование

1. Войдите как продавец
2. Нажмите "Добавить заказ"
3. Заполните обязательные поля:
   - Номер заказа
   - Номер отправления
   - Тип товара
   - Размер
   - Цена
4. Добавьте фото (опционально)
5. Добавьте комментарий (опционально)
6. Нажмите "Сохранить"

### Ожидаемый результат:
- ✅ Заказ создается успешно
- ✅ Отображается в списке заказов
- ✅ Статус: "Добавлен"
- ✅ Продавец: текущий пользователь

## 🔍 Отладка

При ошибках проверьте в консоли браузера:
1. Отправляемые данные
2. Ответ сервера
3. Детали ошибки валидации

При ошибках проверьте в логах сервера:
1. `console.log('Received order data:', json)`
2. `console.log('Validated order successfully:', validatedOrder)`
3. `console.error('Validation failed:', validationError)` 