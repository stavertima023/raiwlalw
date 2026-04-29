-- Add new order statuses for inventory buckets
-- and migrate existing inventory rows to these statuses.

-- 1) Expand allowed values in status check constraint
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (
    status IN ('Добавлен', 'Готов', 'Отправлен', 'Исполнен', 'Отменен', 'Возврат', 'Склад', 'Магазин')
  );

-- 2) Backfill existing rows based on inventory flags
UPDATE public.orders
SET status = 'Склад'
WHERE on_warehouse = true;

UPDATE public.orders
SET status = 'Магазин'
WHERE on_store = true;
