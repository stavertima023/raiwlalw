-- Update expense_category ENUM to match the categories used in the application
-- This script adds the missing categories to the existing ENUM

-- First, let's see what categories we currently have:
-- SELECT unnest(enum_range(NULL::expense_category));

-- Add new values to the expense_category ENUM
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'Ткань';
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'Курьер'; 
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'Расходники швейки';
ALTER TYPE public.expense_category ADD VALUE IF NOT EXISTS 'Другое';

-- Optional: If you want to rename existing values, you would need to:
-- 1. Create a new ENUM with all values
-- 2. Add a temporary column with the new ENUM
-- 3. Update data from old to new column
-- 4. Drop old column and rename new column
-- But for now, we'll keep both old and new values for compatibility

-- Update any existing 'Прочее' entries to 'Другое' (if needed)
-- UPDATE public.expenses SET category = 'Другое' WHERE category = 'Прочее';

-- Verify the updated ENUM values
-- SELECT unnest(enum_range(NULL::expense_category)) AS category ORDER BY category;

COMMENT ON TYPE public.expense_category IS 'Категории расходов: Аренда, Зарплата, Расходники, Маркетинг, Налоги, Ткань, Курьер, Расходники швейки, Транспорт, Коммунальные, Прочее, Другое'; 