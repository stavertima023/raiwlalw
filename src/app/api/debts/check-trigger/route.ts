import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Проверяем существование триггера
    const { data: triggers, error: triggerError } = await supabaseAdmin
      .from('information_schema.triggers')
      .select('trigger_name, event_manipulation, action_statement')
      .eq('trigger_name', 'expenses_debts_trigger');

    // Проверяем существование функции
    const { data: functions, error: functionError } = await supabaseAdmin
      .from('information_schema.routines')
      .select('routine_name, routine_definition')
      .eq('routine_name', 'update_debts_from_expenses');

    // Получаем текущие расходы и их маппинг
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('responsible, amount')
      .in('responsible', ['admin', 'admin_max']);

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Группируем расходы по ответственному
    const expenseMap = new Map<string, number>();
    expenses.forEach(expense => {
      const personName = expense.responsible === 'admin' ? 'Тимофей' : 'Максим';
      expenseMap.set(personName, (expenseMap.get(personName) || 0) + expense.amount);
    });

    // Получаем текущие долги
    const { data: debts, error: debtsError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .order('person_name');

    return NextResponse.json({
      triggerExists: triggers && triggers.length > 0,
      functionExists: functions && functions.length > 0,
      triggerDetails: triggers?.[0] || null,
      functionDetails: functions?.[0] || null,
      expenses: Array.from(expenseMap.entries()).map(([person, amount]) => ({
        person,
        amount,
        responsible: person === 'Тимофей' ? 'admin' : 'admin_max'
      })),
      currentDebts: debts || [],
      expectedMapping: {
        'admin': 'Тимофей',
        'admin_max': 'Максим'
      }
    });
  } catch (error) {
    console.error('Error checking trigger:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 