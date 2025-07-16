-- Analytics cache table for better performance
-- This table can store pre-computed analytics data to avoid heavy calculations on every request
CREATE TABLE public.analytics_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  cache_key TEXT NOT NULL UNIQUE, -- Unique identifier for cached data (e.g., 'orders_2024-01-01_2024-01-31_seller1,seller2')
  data JSONB NOT NULL, -- Cached analytics data in JSON format
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- Cache expiration time
  CONSTRAINT analytics_cache_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- Index for faster lookups
CREATE INDEX idx_analytics_cache_key ON public.analytics_cache (cache_key);
CREATE INDEX idx_analytics_cache_expires ON public.analytics_cache (expires_at);

-- Table for storing analytics snapshots for historical reporting
CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  total_orders INTEGER NOT NULL DEFAULT 0,
  orders_added INTEGER NOT NULL DEFAULT 0,
  orders_ready INTEGER NOT NULL DEFAULT 0,
  orders_sent INTEGER NOT NULL DEFAULT 0,
  orders_completed INTEGER NOT NULL DEFAULT 0,
  orders_cancelled INTEGER NOT NULL DEFAULT 0,
  orders_returned INTEGER NOT NULL DEFAULT 0,
  total_payouts NUMERIC NOT NULL DEFAULT 0,
  average_order_price NUMERIC NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  expenses_rent NUMERIC NOT NULL DEFAULT 0,
  expenses_salary NUMERIC NOT NULL DEFAULT 0,
  expenses_supplies NUMERIC NOT NULL DEFAULT 0,
  expenses_marketing NUMERIC NOT NULL DEFAULT 0,
  expenses_taxes NUMERIC NOT NULL DEFAULT 0,
  expenses_fabric NUMERIC NOT NULL DEFAULT 0,
  expenses_courier NUMERIC NOT NULL DEFAULT 0,
  expenses_sewing_supplies NUMERIC NOT NULL DEFAULT 0,
  expenses_other NUMERIC NOT NULL DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT analytics_snapshots_pkey PRIMARY KEY (id),
  CONSTRAINT analytics_snapshots_created_by_fkey FOREIGN KEY (created_by) REFERENCES users (username) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT unique_snapshot_per_day UNIQUE (snapshot_date, date_from, date_to)
) TABLESPACE pg_default;

-- Index for faster date-based queries
CREATE INDEX idx_analytics_snapshots_date ON public.analytics_snapshots (snapshot_date);
CREATE INDEX idx_analytics_snapshots_period ON public.analytics_snapshots (date_from, date_to);

-- Function to clean up expired cache entries
CREATE OR REPLACE FUNCTION clean_expired_analytics_cache()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.analytics_cache 
  WHERE expires_at < now();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Function to get or create analytics cache
CREATE OR REPLACE FUNCTION get_analytics_cache(
  p_cache_key TEXT,
  p_expiry_hours INTEGER DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  cached_data JSONB;
BEGIN
  SELECT data INTO cached_data
  FROM public.analytics_cache
  WHERE cache_key = p_cache_key
    AND expires_at > now();
  
  RETURN cached_data;
END;
$$;

-- Function to set analytics cache
CREATE OR REPLACE FUNCTION set_analytics_cache(
  p_cache_key TEXT,
  p_data JSONB,
  p_expiry_hours INTEGER DEFAULT 1
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.analytics_cache (cache_key, data, expires_at)
  VALUES (p_cache_key, p_data, now() + (p_expiry_hours || ' hours')::INTERVAL)
  ON CONFLICT (cache_key) 
  DO UPDATE SET 
    data = EXCLUDED.data,
    expires_at = EXCLUDED.expires_at,
    created_at = now();
END;
$$;

-- Enable Row Level Security
ALTER TABLE public.analytics_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS Policies for analytics_cache (Admin only)
CREATE POLICY "Admins can access analytics cache" ON public.analytics_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE username = auth.jwt() ->> 'username' 
      AND role = 'Администратор'
    )
  );

-- RLS Policies for analytics_snapshots (Admin only)
CREATE POLICY "Admins can access analytics snapshots" ON public.analytics_snapshots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE username = auth.jwt() ->> 'username' 
      AND role = 'Администратор'
    )
  );

-- Schedule to clean up expired cache (requires pg_cron extension)
-- SELECT cron.schedule('clean-analytics-cache', '0 */6 * * *', 'SELECT clean_expired_analytics_cache();');

COMMENT ON TABLE public.analytics_cache IS 'Кэш для аналитических данных для улучшения производительности';
COMMENT ON TABLE public.analytics_snapshots IS 'Снимки аналитических данных для исторической отчетности';
COMMENT ON FUNCTION clean_expired_analytics_cache() IS 'Функция для очистки устаревших записей кэша';
COMMENT ON FUNCTION get_analytics_cache(TEXT, INTEGER) IS 'Функция для получения данных из кэша аналитики';
COMMENT ON FUNCTION set_analytics_cache(TEXT, JSONB, INTEGER) IS 'Функция для сохранения данных в кэш аналитики'; 