# Пример правильной реализации скроллинга таблиц

## Проблема
Текущая реализация не обеспечивает отдельный скроллинг для таблиц, что приводит к проблемам на мобильных устройствах.

## Правильная структура

### До (неправильно):
```tsx
<CardContent>
  <div className="overflow-x-auto">
    <Table>
      {/* очень длинный список заказов */}
    </Table>
  </div>
</CardContent>
```

### После (правильно):
```tsx
<CardContent>
  <div className="h-[60vh] overflow-auto border rounded-lg">
    <Table>
      {/* очень длинный список заказов - теперь скроллится отдельно */}
    </Table>
  </div>
</CardContent>
```

## Результат
- ✅ Таблица имеет фиксированную высоту (60vh на мобильных, 70vh на десктопе)
- ✅ Содержимое таблицы скроллится независимо от остальной страницы
- ✅ На мобильных устройствах приложение не сворачивается при скроллинге
- ✅ Горизонтальный скроллинг сохраняется для широких таблиц
- ✅ Визуальные границы делают область скроллинга очевидной

## Техническая реализация

### CSS классы:
```css
.table-container {
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
}

@media (max-width: 768px) {
  .table-container {
    height: 60vh;
    max-height: 500px;
    min-height: 300px;
  }
}

@media (min-width: 769px) {
  .table-container {
    height: 70vh;
    max-height: 600px;
    min-height: 400px;
  }
}
```

### React компонент:
```tsx
export function OrderTable({ orders }: { orders: Order[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Список заказов</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Ключевое изменение: контейнер с фиксированной высотой */}
        <div className="h-[60vh] overflow-auto border rounded-lg table-container">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Дата</TableHead>
                <TableHead>Номер заказа</TableHead>
                {/* ... другие колонки */}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{format(order.orderDate, 'dd.MM.yyyy')}</TableCell>
                  <TableCell>{order.orderNumber}</TableCell>
                  {/* ... другие ячейки */}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Важные моменты

1. **Высота контейнера**: Используем `vh` единицы для адаптивности
2. **Границы**: `border rounded-lg` делают область скроллинга визуально понятной
3. **overflow-auto**: Показывает скроллбары только когда нужно
4. **overscroll-behavior: contain**: Предотвращает bounce-эффект на iOS
5. **-webkit-overflow-scrolling: touch**: Плавный скроллинг на iOS

## Тестирование

### На мобильном:
1. Откройте длинный список заказов
2. Попробуйте скроллить вверх - приложение НЕ должно сворачиваться
3. Содержимое таблицы должно плавно скроллиться

### На десктопе:
1. Длинный список должен показывать тонкие скроллбары
2. Hover-эффекты на скроллбарах должны работать
3. Область скроллинга должна быть визуально отделена границей 