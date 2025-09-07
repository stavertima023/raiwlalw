-- Add new values to enum public.expense_category: 'Просмотры', 'ВБ', 'Компенсация'
-- Safe for re-run

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typname = 'expense_category'
      AND e.enumlabel = 'Просмотры'
  ) THEN
    ALTER TYPE public.expense_category ADD VALUE 'Просмотры';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typname = 'expense_category'
      AND e.enumlabel = 'ВБ'
  ) THEN
    ALTER TYPE public.expense_category ADD VALUE 'ВБ';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typnamespace = 'public'::regnamespace
      AND t.typname = 'expense_category'
      AND e.enumlabel = 'Компенсация'
  ) THEN
    ALTER TYPE public.expense_category ADD VALUE 'Компенсация';
  END IF;
END$$;


