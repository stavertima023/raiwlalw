import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { ExpenseSchema } from '@/lib/types';

// Увеличиваем лимиты для этого API
export const maxDuration = 60; // 60 секунд
export const dynamic = 'force-dynamic';

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

    let query = supabaseAdmin
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    // Если пользователь не администратор, фильтруем только его расходы
    if (user.role !== 'Администратор') {
      query = query.eq('responsible', user.username);
    }
    
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Парсим даты
    const parsedData = data.map(item => ({
      ...item, 
      date: new Date(item.date)
    }));

    return NextResponse.json(parsedData);
  } catch (error: any) {
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

    // Проверяем размер запроса
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeInMB > 10) { // 10MB лимит
        return NextResponse.json({ 
          message: 'Размер запроса слишком большой (максимум 10MB)', 
          error: `Размер: ${sizeInMB.toFixed(2)}MB`
        }, { status: 413 });
      }
    }

    const json = await request.json();
    
    // Проверяем размер фотографии чека
    if (json.receiptPhoto && typeof json.receiptPhoto === 'string') {
      const base64Data = json.receiptPhoto.split(',')[1];
      if (base64Data) {
        const photoSize = Math.ceil((base64Data.length * 3) / 4);
        const photoSizeInMB = photoSize / (1024 * 1024);
        
        if (photoSizeInMB > 5) { // 5MB лимит для фото чека
          return NextResponse.json({ 
            message: 'Размер фотографии чека слишком большой (максимум 5MB)', 
            error: `Размер: ${photoSizeInMB.toFixed(2)}MB`
          }, { status: 413 });
        }
      }
    }

    // Автоматически устанавливаем дату
    const newExpenseData = {
      ...json,
      date: new Date().toISOString(),
    };
    
    // Валидируем данные
    const validatedExpense = ExpenseSchema.omit({ id: true }).parse(newExpenseData);

    // Вставляем расход в базу данных
    const { data, error } = await supabaseAdmin
      .from('expenses')
      .insert(validatedExpense)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Парсим дату перед отправкой ответа
    const result = {
      ...data,
      date: new Date(data.date)
    };

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    // Обрабатываем ошибки валидации Zod
    if (error.name === 'ZodError') {
      const errorDetails = error.errors.map((err: any) => {
        const field = err.path.join('.');
        const message = err.message;
        return `${field}: ${message}`;
      }).join(', ');
      
      return NextResponse.json({ 
        message: 'Ошибка валидации данных', 
        error: errorDetails,
        errors: error.errors
      }, { status: 400 });
    }
    
    // Обрабатываем ошибки Supabase
    if (error.code) {
      return NextResponse.json({ 
        message: 'Ошибка базы данных', 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Ошибка добавления расхода', 
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 