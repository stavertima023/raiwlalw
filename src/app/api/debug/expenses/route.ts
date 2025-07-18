import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Получаем все расходы
    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Группируем по ответственному
    const groupedExpenses = expenses?.reduce((acc, expense) => {
      const responsible = expense.responsible;
      if (!acc[responsible]) {
        acc[responsible] = [];
      }
      acc[responsible].push(expense);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Считаем суммы по ответственному
    const totals = Object.entries(groupedExpenses).reduce((acc, [responsible, expenses]) => {
      acc[responsible] = (expenses as any[]).reduce((sum: number, exp: any) => sum + exp.amount, 0);
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      expenses: expenses || [],
      grouped: groupedExpenses,
      totals,
      count: expenses?.length || 0
    });
  } catch (error) {
    console.error('Error in debug expenses:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Тестовые данные для добавления расхода
    const testExpense = {
      amount: 1000,
      category: 'Расходники',
      responsible: 'Администратор',
      comment: 'Тестовый расход',
      date: new Date().toISOString(),
    };

    console.log('Attempting to insert test expense:', testExpense);

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(testExpense)
      .select()
      .single();

    if (error) {
      console.error('Test insert error:', error);
      return NextResponse.json({ 
        error: 'Failed to insert test expense', 
        details: error 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Test expense inserted successfully',
      data
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 