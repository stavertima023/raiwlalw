# Изменение порядка столбцов для принтовщика

## Задача
В списках заказов для принтовщика (в списках "На изготовление", "На отправку" и "Все заказы") необходимо поменять местами столбцы "Размер" и "Цена", чтобы столбец "Размер" стоял рядом с фотографиями.

## Реализация

### Изменения в OrderTable.tsx

#### 1. Обновление заголовков таблицы
```typescript
<TableHeader>
  <TableRow>
    <TableHead>Номер заказа</TableHead>
    <TableHead>Номер отправления</TableHead>
    <TableHead>Статус</TableHead>
    <TableHead>Тип товара</TableHead>
    {currentUser?.role === 'Принтовщик' ? (
      // Для принтовщика: Размер рядом с Фото
      <>
        <TableHead>Продавец</TableHead>
        <TableHead className="text-right">Цена</TableHead>
        <TableHead>Размер</TableHead>
        <TableHead>Фото</TableHead>
      </>
    ) : (
      // Для остальных: стандартный порядок
      <>
        <TableHead>Размер</TableHead>
        <TableHead>Продавец</TableHead>
        <TableHead className="text-right">Цена</TableHead>
        <TableHead>Фото</TableHead>
      </>
    )}
    <TableHead>Комментарий</TableHead>
    <TableCell>Дата</TableCell>
    <TableCell>Действия</TableCell>
  </TableRow>
</TableHeader>
```

#### 2. Обновление содержимого строк
```typescript
return (
  <TableRow key={order.id}>
    <TableCell className="font-medium">{order.orderNumber}</TableCell>
    <TableCell>{order.shipmentNumber}</TableCell>
    <TableCell>
      <StatusBadge status={order.status} useLargeLayout={useLargeLayout} />
    </TableCell>
    <TableCell>{order.productType}</TableCell>
    {isPrinter ? (
      // Для принтовщика: Размер рядом с Фото
      <>
        <TableCell>{order.seller}</TableCell>
        <TableCell className="text-right">{order.price.toLocaleString('ru-RU')} ₽</TableCell>
        <TableCell>{order.size}</TableCell>
        <TableCell>
          <OrderPhotos photos={order.photos || []} size={photoSize} />
        </TableCell>
      </>
    ) : (
      // Для остальных: стандартный порядок
      <>
        <TableCell>{order.size}</TableCell>
        <TableCell>{order.seller}</TableCell>
        <TableCell className="text-right">{order.price.toLocaleString('ru-RU')} ₽</TableCell>
        <TableCell>
          <OrderPhotos photos={order.photos || []} size={photoSize} />
        </TableCell>
      </>
    )}
    <TableCell>{order.comment}</TableCell>
    <TableCell>{format(new Date(order.orderDate), 'dd.MM.yyyy HH:mm', { locale: ru })}</TableCell>
    <TableCell>{renderActionsCell(order)}</TableCell>
  </TableRow>
);
```

## Порядок столбцов

### Для принтовщика:
1. Номер заказа
2. Номер отправления
3. Статус
4. Тип товара
5. **Продавец**
6. **Цена**
7. **Размер** ← рядом с фото
8. **Фото**
9. Комментарий
10. Дата
11. Действия

### Для остальных пользователей (стандартный порядок):
1. Номер заказа
2. Номер отправления
3. Статус
4. Тип товара
5. **Размер**
6. **Продавец**
7. **Цена**
8. **Фото**
9. Комментарий
10. Дата
11. Действия

## Затронутые компоненты

- ✅ `src/components/dashboard/OrderTable.tsx` - основная таблица заказов
- ❌ `src/components/admin/AdminOrderList.tsx` - админская таблица (не изменяется)

## Затронутые страницы

- ✅ **Принтовщик**: "На изготовление" - заказы со статусом "Добавлен"
- ✅ **Принтовщик**: "На отправку" - заказы со статусом "Готов"
- ✅ **Принтовщик**: "Все заказы" - все заказы с фильтрацией

## Тестирование

### Проверка для принтовщика:
1. ✅ Войти под ролью "Принтовщик"
2. ✅ Открыть вкладку "На изготовление"
3. ✅ Проверить, что столбец "Размер" стоит рядом с "Фото"
4. ✅ Открыть вкладку "На отправку"
5. ✅ Проверить порядок столбцов
6. ✅ Открыть вкладку "Все заказы"
7. ✅ Проверить порядок столбцов

### Проверка для других ролей:
1. ✅ Войти под ролью "Продавец"
2. ✅ Проверить, что порядок столбцов остался стандартным
3. ✅ Войти под ролью "Администратор"
4. ✅ Проверить, что порядок столбцов остался стандартным

## Результат

После внедрения изменений:
- ✅ Принтовщик видит столбец "Размер" рядом с фотографиями
- ✅ Остальные пользователи видят стандартный порядок столбцов
- ✅ Изменения применяются ко всем спискам заказов для принтовщика
- ✅ Функциональность таблицы не нарушена 