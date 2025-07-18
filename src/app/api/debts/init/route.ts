import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Проверяем, существуют ли таблицы долгов
    const { data: existingDebts, error: checkError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      // Таблица не существует, создаем ее
      console.log('Debts table does not exist, creating...');
      
      // Создаем таблицу долгов через прямые запросы
      const { error: createDebtsError } = await supabaseAdmin
        .from('debts')
        .insert({
          person_name: 'Тимофей',
          current_amount: 0
        });

      if (createDebtsError) {
        console.error('Error creating debts table:', createDebtsError);
        return NextResponse.json({ error: 'Failed to create debt tables' }, { status: 500 });
      }
    }

    // Инициализируем долги на основе существующих расходов
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