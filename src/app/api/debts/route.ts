import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Сначала проверяем, есть ли таблица долгов
    const { data: existingDebts, error: checkError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      // Таблица не существует, создаем долги на основе расходов
      console.log('Debts table does not exist, calculating from expenses...');
      
      const { data: expenses, error: expensesError } = await supabaseAdmin
        .from('expenses')
        .select('responsible, amount')
        .in('responsible', ['Администратор', 'Максим']);

      if (expensesError) {
        console.error('Error fetching expenses:', expensesError);
        return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
      }

      // Группируем расходы по ответственному
      const debtMap = new Map<string, number>();
      expenses.forEach(expense => {
        const personName = expense.responsible === 'Администратор' ? 'Тимофей' : 'Максим';
        debtMap.set(personName, (debtMap.get(personName) || 0) + expense.amount);
      });

      // Создаем временные долги для отображения
      const tempDebts = Array.from(debtMap.entries()).map(([personName, amount]) => ({
        id: `temp-${personName}`,
        person_name: personName,
        current_amount: amount,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_temporary: true
      }));

      return NextResponse.json(tempDebts);
    }

    // Если таблица существует, получаем реальные долги
    const { data: debts, error } = await supabaseAdmin
      .from('debts')
      .select('*')
      .order('person_name');

    if (error) {
      console.error('Error fetching debts:', error);
      return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
    }

    return NextResponse.json(debts || []);
  } catch (error) {
    console.error('Error in GET /api/debts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 