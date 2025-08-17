-- Добавляем новые колонки для статистики выводов
-- Выполните это в SQL Editor вашего Supabase проекта

-- Добавляем колонку для статистики по типам товаров (JSON)
ALTER TABLE payouts 
ADD COLUMN IF NOT EXISTS productTypeStats JSONB DEFAULT '{}';

-- Добавляем колонку для среднего чека
ALTER TABLE payouts 
ADD COLUMN IF NOT EXISTS averageCheck DECIMAL(10,2) DEFAULT 0;

-- Обновляем существующие записи, если у них нет orderCount
UPDATE payouts 
SET orderCount = COALESCE(array_length(orderNumbers, 1), 0)
WHERE orderCount IS NULL OR orderCount = 0;

-- Создаем индекс для быстрого поиска по типам товаров
CREATE INDEX IF NOT EXISTS idx_payouts_product_type_stats 
ON payouts USING GIN (productTypeStats);

-- Добавляем комментарий к таблице
COMMENT ON COLUMN payouts.productTypeStats IS 'Статистика по типам товаров в JSON формате';
COMMENT ON COLUMN payouts.averageCheck IS 'Средний чек для данного вывода';

-- Проверяем результат
SELECT 
  COUNT(*) as total_payouts,
  COUNT(*) FILTER (WHERE productTypeStats IS NOT NULL) as has_stats,
  COUNT(*) FILTER (WHERE averageCheck IS NOT NULL) as has_avg_check,
  COUNT(*) FILTER (WHERE orderCount > 0) as has_order_count
FROM payouts;
