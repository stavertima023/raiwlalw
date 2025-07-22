-- Оптимизация базы данных для ускорения запросов
-- Добавляем индексы для часто используемых полей в фильтрации и сортировке

-- Индекс для статуса заказов (используется в фильтрации)
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Индекс для продавца (используется в фильтрации по ролям)
CREATE INDEX IF NOT EXISTS idx_orders_seller ON orders(seller);

-- Индекс для даты заказа (используется в сортировке)
CREATE INDEX IF NOT EXISTS idx_orders_order_date ON orders(orderDate DESC);

-- Индекс для времени готовности (используется в сортировке для принтовщика)
CREATE INDEX IF NOT EXISTS idx_orders_ready_at ON orders(ready_at DESC);

-- Составной индекс для фильтрации по статусу и продавцу
CREATE INDEX IF NOT EXISTS idx_orders_status_seller ON orders(status, seller);

-- Составной индекс для фильтрации по статусу и дате
CREATE INDEX IF NOT EXISTS idx_orders_status_date ON orders(status, orderDate DESC);

-- Индекс для номера заказа (используется в поиске)
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(orderNumber);

-- Индекс для номера отправления (используется в поиске)
CREATE INDEX IF NOT EXISTS idx_orders_shipment_number ON orders(shipmentNumber);

-- Индекс для типа товара (используется в фильтрации)
CREATE INDEX IF NOT EXISTS idx_orders_product_type ON orders(productType);

-- Индекс для расходов по дате
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

-- Индекс для расходов по категории
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);

-- Индекс для выплат по дате
CREATE INDEX IF NOT EXISTS idx_payouts_date ON payouts(date DESC);

-- Индекс для выплат по статусу
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);

-- Индекс для долгов по дате
CREATE INDEX IF NOT EXISTS idx_debts_date ON debts(date DESC);

-- Анализируем таблицы для оптимизации статистики
ANALYZE orders;
ANALYZE expenses;
ANALYZE payouts;
ANALYZE debts; 