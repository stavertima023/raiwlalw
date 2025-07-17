import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { PayoutSchema } from '@/lib/types';

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

    // Only admins can view payouts
    if (user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('payouts')
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
    console.error('GET /api/payouts error:', error);
    return NextResponse.json({ 
      message: 'Ошибка загрузки выводов', 
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

    // Only admins can create payouts
    if (user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const json = await request.json();
    
    // Add processed by user and current date
    const payoutData = {
      ...json,
      processedBy: user.username,
      date: new Date().toISOString(),
      status: 'pending',
    };
    
    // Validate data with Zod schema
    const validatedPayout = PayoutSchema.omit({ id: true }).parse(payoutData);

    const { data, error } = await supabaseAdmin
      .from('payouts')
      .insert(validatedPayout)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ 
        message: 'Ошибка валидации данных', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    console.error('POST /api/payouts error:', error);
    return NextResponse.json({ 
      message: 'Ошибка создания вывода', 
      error: error.message 
    }, { status: 500 });
  }
} 