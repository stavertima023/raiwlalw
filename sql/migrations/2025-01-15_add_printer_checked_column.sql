-- Добавляем колонку для отметок принтовщика
ALTER TABLE orders 
ADD COLUMN "printerChecked" BOOLEAN DEFAULT false;

-- Создаем индекс для быстрого поиска отмеченных заказов
CREATE INDEX IF NOT EXISTS idx_orders_printer_checked 
ON orders ("printerChecked");

-- Комментарий к колонке
COMMENT ON COLUMN orders."printerChecked" IS 'Отметка принтовщика о заказе (для личного использования)';
