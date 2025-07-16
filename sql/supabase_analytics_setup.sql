-- SQL скрипт для настройки аналитики в Supabase
-- Выполните этот скрипт в SQL Editor вашего Supabase проекта

-- =====================================
-- 1. СОЗДАНИЕ ТАБЛИЦ АНАЛИТИКИ
-- =====================================

-- Таблица для агрегированных данных по заказам (ежедневная аналитика)
CREATE TABLE IF NOT EXISTS public.analytics_orders_daily (
    id BIGSERIAL PRIMARY KEY,
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Уникальный индекс по дате и продавцу
    CONSTRAINT unique_analytics_orders_daily_date_seller UNIQUE(date, seller)
);

-- Таблица для агрегированных данных по расходам (ежедневная аналитика)
CREATE TABLE IF NOT EXISTS public.analytics_expenses_daily (
    id BIGSERIAL PRIMARY KEY,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    responsible VARCHAR(100) NOT NULL,
    total_amount DECIMAL(12, 2) DEFAULT 0.00,
    transactions_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Уникальный индекс по дате, категории и ответственному
    CONSTRAINT unique_analytics_expenses_daily_date_category_responsible UNIQUE(date, category, responsible)
);

-- =====================================
-- 2. СОЗДАНИЕ ИНДЕКСОВ
-- =====================================

-- Индексы для таблицы аналитики заказов
CREATE INDEX IF NOT EXISTS idx_analytics_orders_daily_date ON public.analytics_orders_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_orders_daily_seller ON public.analytics_orders_daily(seller);
CREATE INDEX IF NOT EXISTS idx_analytics_orders_daily_date_seller ON public.analytics_orders_daily(date, seller);
CREATE INDEX IF NOT EXISTS idx_analytics_orders_daily_created_at ON public.analytics_orders_daily(created_at);

-- Индексы для таблицы аналитики расходов
CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_date ON public.analytics_expenses_daily(date);
CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_category ON public.analytics_expenses_daily(category);
CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_responsible ON public.analytics_expenses_daily(responsible);
CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_date_category ON public.analytics_expenses_daily(date, category);
CREATE INDEX IF NOT EXISTS idx_analytics_expenses_daily_created_at ON public.analytics_expenses_daily(created_at);

-- =====================================
-- 3. RLS (ROW LEVEL SECURITY) ПОЛИТИКИ
-- =====================================

-- Включаем RLS для таблиц аналитики
ALTER TABLE public.analytics_orders_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_expenses_daily ENABLE ROW LEVEL SECURITY;

-- Политики доступа для администраторов (полный доступ)
CREATE POLICY "Администраторы могут просматривать аналитику заказов" 
ON public.analytics_orders_daily FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Администратор'
    )
);

CREATE POLICY "Администраторы могут изменять аналитику заказов" 
ON public.analytics_orders_daily FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Администратор'
    )
);

CREATE POLICY "Администраторы могут просматривать аналитику расходов" 
ON public.analytics_expenses_daily FOR SELECT 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Администратор'
    )
);

CREATE POLICY "Администраторы могут изменять аналитику расходов" 
ON public.analytics_expenses_daily FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = auth.uid() 
        AND users.role = 'Администратор'
    )
);

-- =====================================
-- 4. ФУНКЦИИ ДЛЯ ОБНОВЛЕНИЯ АНАЛИТИКИ
-- =====================================

-- Функция для обновления ежедневной аналитики заказов
CREATE OR REPLACE FUNCTION public.update_orders_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Удаляем существующие данные за этот день
    DELETE FROM public.analytics_orders_daily WHERE date = target_date;
    
    -- Вставляем обновленные данные
    INSERT INTO public.analytics_orders_daily (
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
    FROM public.orders 
    WHERE DATE(order_date) = target_date
    GROUP BY seller;
    
END;
$$;

-- Функция для обновления ежедневной аналитики расходов
CREATE OR REPLACE FUNCTION public.update_expenses_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Удаляем существующие данные за этот день
    DELETE FROM public.analytics_expenses_daily WHERE date = target_date;
    
    -- Вставляем обновленные данные
    INSERT INTO public.analytics_expenses_daily (
        date, category, responsible, total_amount, transactions_count
    )
    SELECT 
        target_date as date,
        category,
        responsible,
        SUM(amount) as total_amount,
        COUNT(*) as transactions_count
    FROM public.expenses 
    WHERE DATE(date) = target_date
    GROUP BY category, responsible;
    
END;
$$;

-- Функция для полного обновления аналитики
CREATE OR REPLACE FUNCTION public.refresh_analytics(target_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Обновляем аналитику заказов
    PERFORM public.update_orders_analytics(target_date);
    
    -- Обновляем аналитику расходов
    PERFORM public.update_expenses_analytics(target_date);
    
END;
$$;

-- =====================================
-- 5. ТРИГГЕРЫ ДЛЯ АВТОМАТИЧЕСКОГО ОБНОВЛЕНИЯ
-- =====================================

-- Функция-триггер для обновления аналитики заказов
CREATE OR REPLACE FUNCTION public.trigger_update_orders_analytics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Обновляем аналитику для дня, когда был создан/изменен заказ
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_orders_analytics(DATE(NEW.order_date));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_orders_analytics(DATE(OLD.order_date));
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Функция-триггер для обновления аналитики расходов
CREATE OR REPLACE FUNCTION public.trigger_update_expenses_analytics()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Обновляем аналитику для дня, когда был создан/изменен расход
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM public.update_expenses_analytics(DATE(NEW.date));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM public.update_expenses_analytics(DATE(OLD.date));
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$;

-- Создание триггеров
DROP TRIGGER IF EXISTS trigger_orders_analytics ON public.orders;
CREATE TRIGGER trigger_orders_analytics
    AFTER INSERT OR UPDATE OR DELETE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_orders_analytics();

DROP TRIGGER IF EXISTS trigger_expenses_analytics ON public.expenses;
CREATE TRIGGER trigger_expenses_analytics
    AFTER INSERT OR UPDATE OR DELETE ON public.expenses
    FOR EACH ROW EXECUTE FUNCTION public.trigger_update_expenses_analytics();

-- =====================================
-- 6. ПРЕДСТАВЛЕНИЯ ДЛЯ УДОБСТВА ЗАПРОСОВ
-- =====================================

-- Представление для общей аналитики
CREATE OR REPLACE VIEW public.analytics_summary AS
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
FROM public.analytics_orders_daily ao
LEFT JOIN public.users u ON ao.seller = u.username
LEFT JOIN (
    SELECT 
        date,
        SUM(total_amount) as total_expenses
    FROM public.analytics_expenses_daily 
    GROUP BY date
) ae ON ao.date = ae.date;

-- =====================================
-- 7. ПЕРВОНАЧАЛЬНАЯ ЗАГРУЗКА ДАННЫХ
-- =====================================

-- Функция для первоначальной загрузки аналитики
CREATE OR REPLACE FUNCTION public.initialize_analytics(days_back INTEGER DEFAULT 365)
RETURNS TEXT 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    target_date DATE;
    processed_days INTEGER := 0;
BEGIN
    -- Загружаем аналитику за указанное количество дней назад
    FOR target_date IN 
        SELECT generate_series(
            CURRENT_DATE - (days_back || ' days')::INTERVAL, 
            CURRENT_DATE, 
            '1 day'::INTERVAL
        )::DATE
    LOOP
        PERFORM public.refresh_analytics(target_date);
        processed_days := processed_days + 1;
    END LOOP;
    
    RETURN 'Инициализация завершена. Обработано дней: ' || processed_days;
END;
$$;

-- =====================================
-- 8. ПОЛЕЗНЫЕ ЗАПРОСЫ ДЛЯ ПРОВЕРКИ
-- =====================================

-- Проверить количество записей в таблицах аналитики
-- SELECT 'analytics_orders_daily' as table_name, COUNT(*) as count FROM public.analytics_orders_daily
-- UNION ALL
-- SELECT 'analytics_expenses_daily' as table_name, COUNT(*) as count FROM public.analytics_expenses_daily;

-- Проверить последние записи аналитики
-- SELECT * FROM public.analytics_orders_daily ORDER BY date DESC LIMIT 10;
-- SELECT * FROM public.analytics_expenses_daily ORDER BY date DESC LIMIT 10;

-- Пример запроса аналитики за текущий месяц
-- SELECT 
--     date,
--     seller_name,
--     total_orders,
--     total_revenue,
--     total_expenses,
--     net_profit
-- FROM public.analytics_summary 
-- WHERE date >= DATE_TRUNC('month', CURRENT_DATE)
-- ORDER BY date DESC;

-- =====================================
-- ИНСТРУКЦИИ ПО ЗАПУСКУ:
-- =====================================

/*
1. Скопируйте весь этот скрипт
2. Откройте Supabase Dashboard → SQL Editor
3. Вставьте скрипт и нажмите RUN
4. После успешного выполнения запустите инициализацию:
   SELECT public.initialize_analytics(30); -- загрузит данные за последние 30 дней
5. Проверьте работу:
   SELECT * FROM public.analytics_summary ORDER BY date DESC LIMIT 10;
*/

-- =====================================
-- КОММЕНТАРИИ
-- =====================================

COMMENT ON TABLE public.analytics_orders_daily IS 'Ежедневная аналитика заказов для быстрых запросов';
COMMENT ON TABLE public.analytics_expenses_daily IS 'Ежедневная аналитика расходов для быстрых запросов';
COMMENT ON VIEW public.analytics_summary IS 'Сводная аналитика с расчетом прибыли';
COMMENT ON FUNCTION public.refresh_analytics(DATE) IS 'Обновление всей аналитики за указанную дату';
COMMENT ON FUNCTION public.initialize_analytics(INTEGER) IS 'Первоначальная загрузка аналитики за N дней назад'; 