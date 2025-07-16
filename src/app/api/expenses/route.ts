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
    
    // Add responsible user and current date
    const expenseData = {
      ...json,
      responsible: user.username,
      date: new Date().toISOString(),
    };
    
    console.log('Prepared expense data for validation:', expenseData);
    
    // Validate data with Zod schema
    const validatedExpense = ExpenseSchema.omit({ id: true }).parse(expenseData);
    console.log('Validated expense data:', validatedExpense);

    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(validatedExpense)
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    // Enhanced error logging
    console.error('POST /api/expenses error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      stack: error.stack
    });
    
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        message: 'Ошибка валидации данных', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    // Handle Supabase/PostgreSQL specific errors
    if (error.code) {
      let errorMessage = 'Ошибка базы данных';
      
      switch (error.code) {
        case '23505': // unique_violation
          errorMessage = 'Запись с такими данными уже существует';
          break;
        case '23502': // not_null_violation
          errorMessage = `Обязательное поле не заполнено: ${error.column}`;
          break;
        case '23514': // check_violation
          errorMessage = 'Данные не прошли проверку ограничений';
          break;
        case '42703': // undefined_column
          errorMessage = `Неизвестная колонка в базе данных: ${error.message}`;
          break;
        default:
          errorMessage = `Ошибка базы данных (${error.code}): ${error.message}`;
      }
      
      return NextResponse.json({ 
        message: errorMessage,
        error: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Ошибка добавления расхода', 
      error: error.message || 'Неизвестная ошибка сервера'
    }, { status: 500 });
  }
} 