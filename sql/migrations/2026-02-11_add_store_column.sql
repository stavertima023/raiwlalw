-- Add on_store column for "Магазин" inventory
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'on_store'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN on_store BOOLEAN NOT NULL DEFAULT false;

    CREATE INDEX IF NOT EXISTS idx_orders_on_store ON public.orders(on_store) WHERE on_store = true;
  END IF;
END$$;
