import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { ExpenseSchema } from '@/lib/types';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    // Only admins can view expenses
    if (user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      throw error;
    }

    // Parse dates before sending to client
    const parsedData = data.map(item => ({
      ...item,
      date: new Date(item.date)
    }));

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('GET /api/expenses error:', error);
    return NextResponse.json({ 
      message: 'Ошибка загрузки расходов', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    // Only admins can add expenses
    if (user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const json = await request.json();
    console.log('Received expense data:', json);
    
    // Clean up the data - remove empty receiptPhoto and ensure amount is a number
    const cleanData = {
      ...json,
      amount: Number(json.amount),
      category: json.category,
      comment: json.comment || '',
      receiptPhoto: json.receiptPhoto || undefined,
    };
    
    // Additional validation
    if (!cleanData.amount || cleanData.amount <= 0) {
      return NextResponse.json({ 
        message: 'Сумма должна быть больше 0', 
        field: 'amount'
      }, { status: 400 });
    }
    
    if (!cleanData.category) {
      return NextResponse.json({ 
        message: 'Категория обязательна', 
        field: 'category'
      }, { status: 400 });
    }
    console.log('Cleaned data:', cleanData);
    
    // Add responsible user and current date
    const expenseData = {
      ...cleanData,
      responsible: user.username, // Use username to match database schema
      date: new Date().toISOString(),
    };
    console.log('Final expense data for validation:', expenseData);
    
    // Validate data with Zod schema
    const validatedExpense = ExpenseSchema.omit({ id: true }).parse(expenseData);

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(validatedExpense)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('Zod validation error:', error.errors);
      return NextResponse.json({ 
        message: 'Ошибка валидации данных', 
        errors: error.errors,
        details: error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }))
      }, { status: 400 });
    }
    
    console.error('POST /api/expenses error:', error);
    return NextResponse.json({ 
      message: 'Ошибка добавления расхода', 
      error: error.message 
    }, { status: 500 });
  }
} 