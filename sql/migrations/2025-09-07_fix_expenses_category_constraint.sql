-- Fix expenses.category to use enum and drop legacy check constraint
-- Idempotent: safe to run multiple times

-- 1) Ensure enum values exist (Просмотры, ВБ, Компенсация)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typname = 'expense_category'
      AND e.enumlabel = 'Просмотры'
  ) THEN
    ALTER TYPE public.expense_category ADD VALUE 'Просмотры';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typname = 'expense_category'
      AND e.enumlabel = 'ВБ'
  ) THEN
    ALTER TYPE public.expense_category ADD VALUE 'ВБ';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typname = 'expense_category'
      AND e.enumlabel = 'Компенсация'
  ) THEN
    ALTER TYPE public.expense_category ADD VALUE 'Компенсация';
  END IF;
END$$;

-- 2) Drop legacy CHECK constraint if present
DO $$
DECLARE
  cons_name text;
BEGIN
  SELECT conname INTO cons_name
  FROM pg_constraint c
  JOIN pg_class rel ON rel.oid = c.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'expenses'
    AND c.contype = 'c' -- check
    AND conname = 'expenses_category_check';

  IF cons_name IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.expenses DROP CONSTRAINT ' || quote_ident(cons_name);
  END IF;
END$$;

-- 3) Convert column to enum type if it is not already
DO $$
DECLARE
  is_enum boolean;
BEGIN
  SELECT (data_type = 'USER-DEFINED' AND udt_schema = 'public' AND udt_name = 'expense_category')
  INTO is_enum
  FROM information_schema.columns
  WHERE table_schema = 'public' AND table_name = 'expenses' AND column_name = 'category';

  IF NOT COALESCE(is_enum, false) THEN
    ALTER TABLE public.expenses
      ALTER COLUMN category TYPE public.expense_category
      USING category::public.expense_category;
  END IF;
END$$;







