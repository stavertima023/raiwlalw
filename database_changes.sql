-- Добавляем новое поле ready_at в таблицу orders
ALTER TABLE orders ADD COLUMN ready_at TIMESTAMP WITH TIME ZONE;

-- Создаем индекс для быстрой сортировки
CREATE INDEX idx_orders_ready_at ON orders(ready_at DESC);

-- Обновляем существующие заказы со статусом 'Готов', устанавливая ready_at равным текущему времени
UPDATE orders 
SET ready_at = NOW() 
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