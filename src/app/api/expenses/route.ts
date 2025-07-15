import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { ExpenseSchema } from '@/lib/types';

async function checkAdmin(session: any) {
    const { user } = session;
    if (!user || !session.isLoggedIn) {
        return { authorized: false, response: NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 }) };
    }
    if (user.role !== 'Администратор') {
        return { authorized: false, response: NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 }) };
    }
    return { authorized: true, user };
}

export async function GET() {
  const session = await getSession();
  const { authorized, response, user } = await checkAdmin(session);
  if (!authorized) return response;

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
  }

  try {
    const { data, error } = await supabaseAdmin.from('expenses').select('*').order('date', { ascending: false });
    if (error) throw error;
    
    const parsedData = data.map(item => ({...item, date: new Date(item.date) }))
    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ message: 'Ошибка загрузки расходов', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
    const session = await getSession();
    const { authorized, response, user } = await checkAdmin(session);
    if (!authorized) return response;

    if (!supabaseAdmin) {
        return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    try {
        const json = await request.json();
        const newExpenseData = {
          ...json,
          responsible: user.username, // Automatically set responsible user
          date: new Date(),
        };

        const validatedExpense = ExpenseSchema.omit({ id: true }).parse(newExpenseData);
        
        const { data, error } = await supabaseAdmin.from('expenses').insert(validatedExpense).select().single();
        if (error) throw error;
        
        return NextResponse.json(data, { status: 201 });
    } catch (error: any) {
        if (error.name === 'ZodError') {
           return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
        }
        return NextResponse.json({ message: 'Ошибка добавления расхода', error: error.message }, { status: 500 });
    }
} 