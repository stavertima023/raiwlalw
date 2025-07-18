import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Проверяем структуру таблицы расходов
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('id, responsible, amount, category, date')
      .limit(3);

    if (expensesError) {
      return NextResponse.json({ 
        error: 'Failed to fetch expenses', 
        details: expensesError 
      }, { status: 500 });
    }

    // Проверяем структуру таблицы пользователей
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, username, name, role')
      .limit(3);

    if (usersError) {
      return NextResponse.json({ 
        error: 'Failed to fetch users', 
        details: usersError 
      }, { status: 500 });
    }

    // Проверяем, есть ли таблица долгов
    const { data: debts, error: debtsError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .limit(1);

    return NextResponse.json({
      message: 'Database structure info',
      expenses: expenses || [],
      users: users || [],
      debts: debts || [],
      debtsError: debtsError ? debtsError.message : null,
      expenseCount: expenses?.length || 0,
      userCount: users?.length || 0,
      debtCount: debts?.length || 0,
      sampleExpense: expenses?.[0] || null,
      sampleUser: users?.[0] || null
    });
  } catch (error) {
    console.error('Debug DB structure error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 