# Исправление триггера долгов

## Проблема
Долги показываются неправильно до нажатия кнопки "Пересчитать" - все расходы считаются как долг Тимофею независимо от ответственного.

## Причина
Триггер в базе данных использует неправильную логику маппинга username к долгам.

## Решение

### Вариант 1: Автоматическое исправление (рекомендуется)
1. Откройте приложение в браузере
2. Перейдите в раздел "Долги кассы"
3. Нажмите кнопку **"Исправить триггер"** (оранжевая кнопка)
4. Дождитесь сообщения об успешном исправлении
5. Долги должны сразу отображаться корректно

### Вариант 2: Ручное исправление в Supabase
Если автоматическое исправление не работает:

1. Откройте [Supabase Dashboard](https://supabase.com/dashboard)
2. Выберите ваш проект
3. Перейдите в **SQL Editor**
4. Выполните следующий SQL скрипт:

```sql
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
```

5. После выполнения скрипта нажмите кнопку **"Пересчитать"** в приложении

## Проверка исправления
После исправления:
- Расходы от `admin` (Администратор) должны добавляться к долгу **Тимофея**
- Расходы от `admin_max` (Максим) должны добавляться к долгу **Максима**
- Долги должны отображаться корректно сразу при загрузке страницы
- Новые расходы должны автоматически обновлять долги

## API для диагностики
Для проверки состояния триггера используйте:
- `GET /api/debts/check-trigger` - проверка состояния триггера
- `POST /api/debts/fix-trigger` - автоматическое исправление триггера
- `POST /api/debts/recalculate` - пересчет долгов 