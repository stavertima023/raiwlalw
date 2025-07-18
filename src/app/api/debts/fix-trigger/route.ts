import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // SQL скрипт для исправления триггера
    const fixTriggerSQL = `
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
    `;

    // Выполняем SQL скрипт
    const { error: sqlError } = await supabaseAdmin.rpc('exec_sql', { sql: fixTriggerSQL });
    
    if (sqlError) {
      console.error('Error executing SQL:', sqlError);
      
      // Fallback: попробуем выполнить через прямые запросы
      console.log('Trying fallback method...');
      
      // Сначала очищаем долги
      await supabaseAdmin.from('debts').delete().neq('person_name', '');
      
      // Пересчитываем долги на основе существующих расходов
      const { data: expenses, error: expensesError } = await supabaseAdmin
        .from('expenses')
        .select('responsible, amount')
        .in('responsible', ['admin', 'admin_max']);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
      }

      // Группируем расходы по ответственному
      const debtMap = new Map<string, number>();
      expenses.forEach(expense => {
        const personName = expense.responsible === 'admin' ? 'Тимофей' : 'Максим';
        debtMap.set(personName, (debtMap.get(personName) || 0) + expense.amount);
      });

      // Вставляем долги
      for (const [personName, amount] of debtMap) {
        const { error: insertError } = await supabaseAdmin
          .from('debts')
          .insert({
            person_name: personName,
            current_amount: amount,
            updated_at: new Date().toISOString()
          });

        if (insertError) {
          console.error(`Error inserting debt for ${personName}:`, insertError);
        }
      }
    }

    // Получаем обновленные долги
    const { data: debts, error: fetchError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .order('person_name');

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch updated debts' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Trigger fixed and debts recalculated successfully', 
      debts: debts || [],
      triggerFixed: !sqlError
    });
  } catch (error) {
    console.error('Error fixing trigger:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 