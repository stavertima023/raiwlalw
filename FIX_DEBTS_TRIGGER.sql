-- SQL скрипт для исправления триггера долгов в Supabase
-- Выполните этот скрипт в SQL Editor в Supabase Dashboard

-- Удаляем старый триггер
DROP TRIGGER IF EXISTS expenses_debts_trigger ON expenses;

-- Обновляем функцию для правильного маппинга username к долгам
CREATE OR REPLACE FUNCTION update_debts_from_expenses()
RETURNS TRIGGER AS $$
BEGIN
  -- Если это новый расход
  IF TG_OP = 'INSERT' THEN
    -- Проверяем, есть ли долг для ответственного
    IF NEW.responsible = 'admin' THEN
      -- Добавляем к долгу Тимофея (admin -> Тимофей)
      INSERT INTO debts (person_name, current_amount)
      VALUES ('Тимофей', NEW.amount)
      ON CONFLICT (person_name)
      DO UPDATE SET 
        current_amount = debts.current_amount + NEW.amount,
        updated_at = now();
    ELSIF NEW.responsible = 'admin_max' THEN
      -- Добавляем к долгу Максима (admin_max -> Максим)
      INSERT INTO debts (person_name, current_amount)
      VALUES ('Максим', NEW.amount)
      ON CONFLICT (person_name)
      DO UPDATE SET 
        current_amount = debts.current_amount + NEW.amount,
        updated_at = now();
    END IF;
  END IF;
  
  -- Если это обновление расхода
  IF TG_OP = 'UPDATE' THEN
    -- Сначала отменяем старый расход
    IF OLD.responsible = 'admin' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Тимофей';
    ELSIF OLD.responsible = 'admin_max' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Максим';
    END IF;
    
    -- Затем добавляем новый расход
    IF NEW.responsible = 'admin' THEN
      INSERT INTO debts (person_name, current_amount)
      VALUES ('Тимофей', NEW.amount)
      ON CONFLICT (person_name)
      DO UPDATE SET 
        current_amount = debts.current_amount + NEW.amount,
        updated_at = now();
    ELSIF NEW.responsible = 'admin_max' THEN
      INSERT INTO debts (person_name, current_amount)
      VALUES ('Максим', NEW.amount)
      ON CONFLICT (person_name)
      DO UPDATE SET 
        current_amount = debts.current_amount + NEW.amount,
        updated_at = now();
    END IF;
  END IF;
  
  -- Если это удаление расхода
  IF TG_OP = 'DELETE' THEN
    IF OLD.responsible = 'admin' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Тимофей';
    ELSIF OLD.responsible = 'admin_max' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Максим';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Создаем новый триггер
CREATE TRIGGER expenses_debts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_debts_from_expenses();

-- Проверяем текущие расходы и их маппинг
SELECT 
  responsible,
  CASE 
    WHEN responsible = 'admin' THEN 'Тимофей'
    WHEN responsible = 'admin_max' THEN 'Максим'
    ELSE 'Другой'
  END as debt_person,
  COUNT(*) as expense_count,
  SUM(amount) as total_amount
FROM expenses 
WHERE responsible IN ('admin', 'admin_max')
GROUP BY responsible
ORDER BY responsible;

-- Проверяем текущие долги
SELECT * FROM debts ORDER BY person_name; 