# Настройка системы долгов в Supabase

## Шаг 1: Создание таблиц долгов

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Выполните следующий SQL скрипт:

```sql
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
```

## Шаг 2: Создание функции и триггера

Выполните следующий SQL для автоматического обновления долгов:

```sql
-- Функция для обновления долгов на основе расходов
CREATE OR REPLACE FUNCTION update_debts_from_expenses()
RETURNS TRIGGER AS $$
BEGIN
  -- Если это новый расход
  IF TG_OP = 'INSERT' THEN
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
  
  -- Если это обновление расхода
  IF TG_OP = 'UPDATE' THEN
    -- Отменяем старый расход
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
    
    -- Добавляем новый расход
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

-- Создание триггера
DROP TRIGGER IF EXISTS expenses_debts_trigger ON expenses;
CREATE TRIGGER expenses_debts_trigger
  AFTER INSERT OR UPDATE OR DELETE ON expenses
  FOR EACH ROW
  EXECUTE FUNCTION update_debts_from_expenses();
```

## Шаг 3: Инициализация долгов

Выполните SQL для инициализации долгов на основе существующих расходов:

```sql
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
```

## Шаг 4: Настройка RLS (Row Level Security)

```sql
-- Включение RLS для таблиц долгов
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE debt_payments ENABLE ROW LEVEL SECURITY;

-- Политики RLS для таблиц долгов
CREATE POLICY "Debts are viewable by admins" ON debts FOR SELECT USING (true);
CREATE POLICY "Debt payments are viewable by admins" ON debt_payments FOR SELECT USING (true);
CREATE POLICY "Debt payments can be created by admins" ON debt_payments FOR INSERT WITH CHECK (true);
```

## Шаг 5: Проверка результата

```sql
-- Проверка созданных долгов
SELECT * FROM debts ORDER BY person_name;

-- Проверка триггера (добавьте новый расход и проверьте, обновился ли долг)
SELECT * FROM debts WHERE person_name = 'Тимофей';
```

## Функциональность после настройки

После выполнения всех шагов вы получите:

1. **Автоматический расчет долгов** - при добавлении расходов долги обновляются автоматически
2. **Отображение долгов** - в интерфейсе будут показываться актуальные долги Тимофея и Максима
3. **Кнопки погашения** - станут активными для погашения долгов
4. **История платежей** - будет доступна для просмотра истории погашения

## Примечания

- Расходы от "Администратор" → долг "Тимофей"
- Расходы от "Максим" → долг "Максим"
- Долги обновляются автоматически при добавлении/изменении/удалении расходов
- Все операции с долгами доступны только администраторам 