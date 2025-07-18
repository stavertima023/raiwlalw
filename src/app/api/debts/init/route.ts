import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Сначала создаем таблицы долгов, если их нет
    const createTablesQuery = `
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
    `;

    const { error: createError } = await supabaseAdmin.rpc('exec_sql', { sql: createTablesQuery });
    
    if (createError) {
      console.error('Error creating tables:', createError);
      // Попробуем выполнить SQL напрямую
      const { error: directError } = await supabaseAdmin.from('debts').select('count').limit(1);
      if (directError) {
        return NextResponse.json({ error: 'Failed to create debt tables' }, { status: 500 });
      }
    }

    // Теперь инициализируем долги на основе существующих расходов
    const initDebtsQuery = `
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
    `;

    const { error: initError } = await supabaseAdmin.rpc('exec_sql', { sql: initDebtsQuery });
    
    if (initError) {
      console.error('Error initializing debts:', initError);
      // Попробуем альтернативный способ
      const { data: expenses, error: expensesError } = await supabaseAdmin
        .from('expenses')
        .select('responsible, amount')
        .in('responsible', ['Администратор', 'Максим']);

      if (expensesError) {
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
      }

      // Группируем расходы по ответственному
      const debtMap = new Map<string, number>();
      expenses.forEach(expense => {
        const personName = expense.responsible === 'Администратор' ? 'Тимофей' : 'Максим';
        debtMap.set(personName, (debtMap.get(personName) || 0) + expense.amount);
      });

      // Вставляем или обновляем долги
      for (const [personName, amount] of debtMap) {
        const { error: upsertError } = await supabaseAdmin
          .from('debts')
          .upsert({
            person_name: personName,
            current_amount: amount,
            updated_at: new Date().toISOString()
          }, { onConflict: 'person_name' });

        if (upsertError) {
          console.error(`Error upserting debt for ${personName}:`, upsertError);
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
      message: 'Debts initialized successfully', 
      debts: debts || [] 
    });
  } catch (error) {
    console.error('Error in debt initialization:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 