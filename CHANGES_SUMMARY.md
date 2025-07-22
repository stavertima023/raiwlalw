# Изменения для реализации функционала готовности заказов

## 1. База данных (Supabase)
- Добавлено поле `ready_at` (TIMESTAMP WITH TIME ZONE) в таблицу orders
- Создан индекс для быстрой сортировки по ready_at
- Создана функция и триггер для автоматического обновления ready_at при изменении статуса

## 2. API изменения
- Обновлен `/api/orders` для включения поля ready_at в ответы
- Обновлен `/api/orders/[orderId]` для включения ready_at при изменении статуса

## 3. Типы данных
- Добавлено поле `ready_at` в OrderSchema и тип Order

## 4. Frontend изменения
- Обновлен PrinterDashboard для сортировки заказов "На отправку" по времени готовности (сначала новые)
- Обновлен OrderTable для отображения столбца "Время готовности" только для принтовщика
- Добавлено форматирование времени готовности в таблице

## 5. Логика работы
- Заказы со статусом "Готов" автоматически попадают в раздел "На отправку" для принтовщика
- Время готовности записывается автоматически при изменении статуса на "Готов"
- Заказы сортируются по времени готовности (новые сверху)
- Столбец "Время готовности" отображается только для роли "Принтовщик"

## SQL для выполнения в Supabase:
```sql
-- Добавляем новое поле ready_at в таблицу orders
ALTER TABLE orders ADD COLUMN ready_at TIMESTAMP WITH TIME ZONE;

-- Создаем индекс для быстрой сортировки
CREATE INDEX idx_orders_ready_at ON orders(ready_at DESC);

-- Обновляем существующие заказы со статусом 'Готов', устанавливая ready_at равным updated_at
UPDATE orders 
SET ready_at = updated_at 
WHERE status = 'Готов' AND ready_at IS NULL;

-- Создаем функцию для автоматического обновления ready_at при изменении статуса
CREATE OR REPLACE FUNCTION update_ready_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Если статус изменился на 'Готов', устанавливаем ready_at
    IF NEW.status = 'Готов' AND (OLD.status IS NULL OR OLD.status != 'Готов') THEN
        NEW.ready_at = NOW();
    END IF;
    
    -- Если статус изменился с 'Готов' на другой, очищаем ready_at
    IF OLD.status = 'Готов' AND NEW.status != 'Готов' THEN
        NEW.ready_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Создаем триггер для автоматического обновления ready_at
CREATE TRIGGER trigger_update_ready_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_ready_at();
``` 