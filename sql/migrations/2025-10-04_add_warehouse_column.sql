-- Add on_warehouse column to orders table
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'on_warehouse'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN on_warehouse BOOLEAN NOT NULL DEFAULT false;
    
    -- Add index for better performance when filtering warehouse orders
    CREATE INDEX IF NOT EXISTS idx_orders_on_warehouse ON public.orders(on_warehouse) WHERE on_warehouse = true;
  END IF;
END$$;
