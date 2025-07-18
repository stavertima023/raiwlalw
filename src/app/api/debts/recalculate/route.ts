import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Получаем все расходы
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

    console.log('Calculated debts:', Object.fromEntries(debtMap));

    // Очищаем существующие долги
    const { error: deleteError } = await supabaseAdmin
      .from('debts')
      .delete()
      .in('person_name', ['Тимофей', 'Максим']);

    if (deleteError) {
      console.error('Error deleting existing debts:', deleteError);
      return NextResponse.json({ error: 'Failed to delete existing debts' }, { status: 500 });
    }

    // Вставляем новые долги
    const newDebts = [];
    for (const [personName, amount] of debtMap) {
      const { data: debt, error: insertError } = await supabaseAdmin
        .from('debts')
        .insert({
          person_name: personName,
          current_amount: amount,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error(`Error inserting debt for ${personName}:`, insertError);
        return NextResponse.json({ error: `Failed to insert debt for ${personName}` }, { status: 500 });
      }

      newDebts.push(debt);
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
      message: 'Debts recalculated successfully', 
      debts: debts || [],
      calculation: Object.fromEntries(debtMap)
    });
  } catch (error) {
    console.error('Error in debt recalculation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 