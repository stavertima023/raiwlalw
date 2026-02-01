-- Add manual_warehouse column to mark orders added manually by printer (not from real sales)
-- These orders should not appear in admin list or analytics
-- Idempotent: safe to run multiple times

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name = 'manual_warehouse'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN manual_warehouse BOOLEAN NOT NULL DEFAULT false;
    
    CREATE INDEX IF NOT EXISTS idx_orders_manual_warehouse ON public.orders(manual_warehouse) WHERE manual_warehouse = true;
  END IF;
END$$;
