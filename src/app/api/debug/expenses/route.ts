import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Проверяем структуру таблицы расходов
    const { data: expenses, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .limit(5);

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch expenses', 
        details: error 
      }, { status: 500 });
    }

    // Проверяем структуру таблицы пользователей
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, username, name, role')
      .limit(5);

    if (usersError) {
      return NextResponse.json({ 
        error: 'Failed to fetch users', 
        details: usersError 
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Debug info',
      expenses: expenses || [],
      users: users || [],
      expenseCount: expenses?.length || 0,
      userCount: users?.length || 0
    });
  } catch (error) {
    console.error('Debug API error:', error);
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