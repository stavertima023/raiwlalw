-- Initialize debts for Тимофей and Максим
-- This script creates initial debt records for the cash register

-- Insert debt for Тимофей (assuming user ID exists)
INSERT INTO debts (person_name, base_amount, current_amount, created_at, updated_at)
VALUES 
  ('Тимофей', 50000, 50000, NOW(), NOW())
ON CONFLICT (person_name) DO NOTHING;

-- Insert debt for Максим (assuming user ID exists)
INSERT INTO debts (person_name, base_amount, current_amount, created_at, updated_at)
VALUES 
  ('Максим', 30000, 30000, NOW(), NOW())
ON CONFLICT (person_name) DO NOTHING;

-- Update current amounts based on existing expenses
UPDATE debts 
SET current_amount = base_amount + (
  SELECT COALESCE(SUM(amount), 0)
  FROM expenses e
  JOIN users u ON e.responsible = u.id
  WHERE u.name = debts.person_name
),
updated_at = NOW()
WHERE person_name IN ('Тимофей', 'Максим'); 