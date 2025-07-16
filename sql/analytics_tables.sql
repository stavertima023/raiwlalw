-- SQL скрипт для создания таблиц аналитики
-- Этот скрипт создает таблицы для эффективного хранения и запроса аналитических данных

-- Таблица для агрегированных данных по заказам (ежедневная аналитика)
CREATE TABLE IF NOT EXISTS analytics_orders_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    seller VARCHAR(100) NOT NULL,
    total_orders INTEGER DEFAULT 0,
    orders_added INTEGER DEFAULT 0,
    orders_completed INTEGER DEFAULT 0,
    orders_shipped INTEGER DEFAULT 0,
    orders_cancelled INTEGER DEFAULT 0,
    orders_returned INTEGER DEFAULT 0,
    total_revenue DECIMAL(12, 2) DEFAULT 0.00,
    total_cost DECIMAL(12, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Уникальный индекс по дате и продавцу
    UNIQUE(date, seller)
);

-- Таблица для агрегированных данных по расходам (ежедневная аналитика)
CREATE TABLE IF NOT EXISTS analytics_expenses_daily (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    responsible VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    transactions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Уникальный индекс по дате, категории и ответственному
    UNIQUE(date, category, responsible)
);

-- Материализованное представление для общей аналитики
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_summary AS
SELECT 
    ao.date,
    ao.seller,
    u.name as seller_name,
    ao.total_orders,
    ao.orders_added,
    ao.orders_completed,
    ao.orders_shipped,
    ao.orders_cancelled,
    ao.orders_returned,
    ao.total_revenue,
    ao.total_cost,
    (ao.total_revenue - ao.total_cost) as gross_profit,
    -- Агрегированные расходы за день
    COALESCE(ae.total_expenses, 0) as total_expenses,
    -- Чистая прибыль (выручка - себестоимость - расходы)
    (ao.total_revenue - ao.total_cost - COALESCE(ae.total_expenses, 0)) as net_profit
FROM analytics_orders_daily ao
LEFT JOIN users u ON ao.seller = u.username
LEFT JOIN (
    SELECT 
        date,
        SUM(total_amount) as total_expenses
    FROM analytics_expenses_daily 
    GROUP BY date
) ae ON ao.date = ae.date;

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_analytics_orders_daily_date ON analytics_orders_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_orders_daily_seller ON analytics_orders_daily(seller);
CREATE INDEX IF NOT EXISTS idx_analytics_orders_daily_date_seller ON analytics_orders_daily(date, seller);

CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_date ON analytics_expenses_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_category ON analytics_expenses_daily(category);
CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_date_category ON analytics_expenses_daily(date, category);

-- Индекс для материализованного представления
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_summary_date_seller ON analytics_summary(date, seller);

-- Функция для обновления ежедневной аналитики заказов
CREATE OR REPLACE FUNCTION update_orders_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Удаляем существующие данные за этот день
    DELETE FROM analytics_orders_daily WHERE date = target_date;
    
    -- Вставляем обновленные данные
    INSERT INTO analytics_orders_daily (
        date, seller, total_orders, orders_added, orders_completed, 
        orders_shipped, orders_cancelled, orders_returned, 
        total_revenue, total_cost
    )
    SELECT 
        target_date as date,
        seller,
        COUNT(*) as total_orders,
        COUNT(*) FILTER (WHERE status = 'Добавлен') as orders_added,
        COUNT(*) FILTER (WHERE status = 'Исполнен') as orders_completed,
        COUNT(*) FILTER (WHERE status = 'Отправлен') as orders_shipped,
        COUNT(*) FILTER (WHERE status = 'Отменен') as orders_cancelled,
        COUNT(*) FILTER (WHERE status = 'Возврат') as orders_returned,
        SUM(CASE WHEN status IN ('Исполнен', 'Отправлен') THEN price ELSE 0 END) as total_revenue,
        SUM(COALESCE(cost, 0)) as total_cost
    FROM orders 
    WHERE DATE(order_date) = target_date
    GROUP BY seller;
    
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления ежедневной аналитики расходов
CREATE OR REPLACE FUNCTION update_expenses_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Удаляем существующие данные за этот день
    DELETE FROM analytics_expenses_daily WHERE date = target_date;
    
    -- Вставляем обновленные данные
    INSERT INTO analytics_expenses_daily (
        date, category, responsible, total_amount, transactions_count
    )
    SELECT 
        target_date as date,
        category,
        responsible,
        SUM(amount) as total_amount,
        COUNT(*) as transactions_count
    FROM expenses 
    WHERE DATE(date) = target_date
    GROUP BY category, responsible;
    
END;
$$ LANGUAGE plpgsql;

-- Функция для обновления всей аналитики
CREATE OR REPLACE FUNCTION refresh_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    -- Обновляем аналитику заказов
    PERFORM update_orders_analytics(target_date);
    
    -- Обновляем аналитику расходов
    PERFORM update_expenses_analytics(target_date);
    
    -- Обновляем материализованное представление
    REFRESH MATERIALIZED VIEW analytics_summary;
    
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления аналитики при изменении заказов
CREATE OR REPLACE FUNCTION trigger_update_orders_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем аналитику для дня, когда был создан/изменен заказ
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_orders_analytics(DATE(NEW.order_date));
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_orders_analytics(DATE(OLD.order_date));
    END IF;
    
    -- Обновляем материализованное представление
    REFRESH MATERIALIZED VIEW analytics_summary;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Триггер для автоматического обновления аналитики при изменении расходов
CREATE OR REPLACE FUNCTION trigger_update_expenses_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Обновляем аналитику для дня, когда был создан/изменен расход
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_expenses_analytics(DATE(NEW.date));
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_expenses_analytics(DATE(OLD.date));
    END IF;
    
    -- Обновляем материализованное представление
    REFRESH MATERIALIZED VIEW analytics_summary;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Создание триггеров
DROP TRIGGER IF EXISTS trigger_orders_analytics ON orders;
CREATE TRIGGER trigger_orders_analytics
    AFTER INSERT OR UPDATE OR DELETE ON orders
    FOR EACH ROW EXECUTE FUNCTION trigger_update_orders_analytics();

DROP TRIGGER IF EXISTS trigger_expenses_analytics ON expenses;
CREATE TRIGGER trigger_expenses_analytics
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW EXECUTE FUNCTION trigger_update_expenses_analytics();

-- Первоначальная загрузка данных аналитики (запустить один раз)
-- ВНИМАНИЕ: Эти операции могут занять время на больших объемах данных
-- Раскомментируйте следующие строки для первоначальной загрузки:

/*
-- Загружаем аналитику заказов за последние 365 дней
DO $$
DECLARE
    target_date DATE;
BEGIN
    FOR target_date IN 
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '365 days', 
            CURRENT_DATE, 
            '1 day'::interval
        )::DATE
    LOOP
        PERFORM update_orders_analytics(target_date);
    END LOOP;
END $$;

-- Загружаем аналитику расходов за последние 365 дней
DO $$
DECLARE
    target_date DATE;
BEGIN
    FOR target_date IN 
        SELECT generate_series(
            CURRENT_DATE - INTERVAL '365 days', 
            CURRENT_DATE, 
            '1 day'::interval
        )::DATE
    LOOP
        PERFORM update_expenses_analytics(target_date);
    END LOOP;
END $$;

-- Обновляем материализованное представление
REFRESH MATERIALIZED VIEW analytics_summary;
*/

-- Примеры полезных запросов для аналитики:

-- 1. Аналитика по месяцам за текущий год
/*
SELECT 
    DATE_TRUNC('month', date) as month,
    SUM(total_orders) as total_orders,
    SUM(orders_completed) as completed_orders,
    SUM(total_revenue) as total_revenue,
    SUM(total_expenses) as total_expenses,
    SUM(net_profit) as net_profit
FROM analytics_summary
WHERE date >= DATE_TRUNC('year', CURRENT_DATE)
GROUP BY DATE_TRUNC('month', date)
ORDER BY month;
*/

-- 2. Топ продавцов по выручке за месяц
/*
SELECT 
    seller,
    seller_name,
    SUM(total_revenue) as total_revenue,
    SUM(total_orders) as total_orders,
    ROUND(SUM(total_revenue) / NULLIF(SUM(total_orders), 0), 2) as avg_order_value
FROM analytics_summary
WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
GROUP BY seller, seller_name
ORDER BY total_revenue DESC;
*/

-- 3. Расходы по категориям за период
/*
SELECT 
    category,
    SUM(total_amount) as total_amount,
    SUM(transactions_count) as transactions_count
FROM analytics_expenses_daily
WHERE date BETWEEN '2024-01-01' AND '2024-12-31'
GROUP BY category
ORDER BY total_amount DESC;
*/ 