-- Создание таблиц для системы долгов

-- Таблица долгов
CREATE TABLE IF NOT EXISTS public.debts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  person_name TEXT NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT debts_pkey PRIMARY KEY (id),
  CONSTRAINT debts_person_name_key UNIQUE (person_name)
);

-- Таблица платежей по долгам
CREATE TABLE IF NOT EXISTS public.debt_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  debt_id UUID NOT NULL,
  payment_amount NUMERIC NOT NULL,
  remaining_debt NUMERIC NOT NULL,
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  receipt_photo TEXT NULL,
  comment TEXT NULL,
  processed_by TEXT NOT NULL,
  CONSTRAINT debt_payments_pkey PRIMARY KEY (id),
  CONSTRAINT debt_payments_debt_id_fkey FOREIGN KEY (debt_id) REFERENCES debts (id) ON DELETE CASCADE,
  CONSTRAINT debt_payments_processed_by_fkey FOREIGN KEY (processed_by) REFERENCES users (username) ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Функция для обновления долгов на основе расходов
CREATE OR REPLACE FUNCTION update_debts_from_expenses()
RETURNS TRIGGER AS $$
BEGIN
  -- Если это новый расход
  IF TG_OP = 'INSERT' THEN
    -- Проверяем, есть ли долг для ответственного
    IF NEW.responsible = 'Администратор' THEN
      -- Добавляем к долгу Тимофея
      INSERT INTO debts (person_name, current_amount)
      VALUES ('Тимофей', NEW.amount)
      ON CONFLICT (person_name)
      DO UPDATE SET 
        current_amount = debts.current_amount + NEW.amount,
        updated_at = now();
    ELSIF NEW.responsible = 'Максим' THEN
      -- Добавляем к долгу Максима
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
    IF OLD.responsible = 'Администратор' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Тимофей';
    ELSIF OLD.responsible = 'Максим' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Максим';
    END IF;
    
    -- Затем добавляем новый расход
    IF NEW.responsible = 'Администратор' THEN
      INSERT INTO debts (person_name, current_amount)
      VALUES ('Тимофей', NEW.amount)
      ON CONFLICT (person_name)
      DO UPDATE SET 
        current_amount = debts.current_amount + NEW.amount,
        updated_at = now();
    ELSIF NEW.responsible = 'Максим' THEN
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
    IF OLD.responsible = 'Администратор' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Тимофей';
    ELSIF OLD.responsible = 'Максим' THEN
      UPDATE debts 
      SET current_amount = current_amount - OLD.amount,
          updated_at = now()
      WHERE person_name = 'Максим';
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Создание триггера для автоматического обновления долгов
DROP TRIGGER IF EXISTS expenses_debts_trigger ON expenses;
CREATE TRIGGER expenses_debts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_debts_from_expenses();

-- Инициализация долгов на основе существующих расходов
INSERT INTO debts (person_name, current_amount)
SELECT 
  CASE 
    WHEN responsible = 'Администратор' THEN 'Тимофей'
    WHEN responsible = 'Максим' THEN 'Максим'
  END as person_name,
  SUM(amount) as current_amount
FROM expenses 
WHERE responsible IN ('Администратор', 'Максим')
GROUP BY responsible
ON CONFLICT (person_name)
DO UPDATE SET 
  current_amount = EXCLUDED.current_amount,
  updated_at = now();

-- Включение RLS для таблиц долгов
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- Политики RLS для таблиц долгов
CREATE POLICY "Debts are viewable by admins" ON debts FOR SELECT USING (true);
CREATE POLICY "Debt payments are viewable by admins" ON debt_payments FOR SELECT USING (true);
CREATE POLICY "Debt payments can be created by admins" ON debt_payments FOR INSERT WITH CHECK (true); 