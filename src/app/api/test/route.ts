import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Проверяем таблицу долгов
    const { data: debts, error: debtsError } = await supabaseAdmin
      .from('debts')
      .select('*');

    // Проверяем таблицу платежей
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('debt_payments')
      .select('*');

    // Проверяем расходы
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('responsible, amount')
      .in('responsible', ['Администратор', 'Максим']);

    return NextResponse.json({
      debts: debts || [],
      payments: payments || [],
      expenses: expenses || [],
      errors: {
        debts: debtsError?.message,
        payments: paymentsError?.message,
        expenses: expensesError?.message,
      }
    });
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 