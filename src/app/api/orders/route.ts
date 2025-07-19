import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';
import { cleanImageArray } from '@/lib/imageUtils';

export async function GET() {
  try {
    // Check supabaseAdmin availability
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }
    
    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    // Оптимизированный запрос с выбором только нужных полей
    let query = supabaseAdmin
      .from('orders')
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment')
      .order('orderDate', { ascending: false });

    // Если пользователь продавец, фильтруем только его заказы
    if (user.role === 'Продавец') {
      query = query.eq('seller', user.username);
    }
    
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Парсим даты и возвращаем данные
    const parsedData = data.map(item => ({
      ...item, 
      orderDate: new Date(item.orderDate)
    }));

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ 
      message: 'Ошибка загрузки заказов', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    // Проверяем доступность сервисов
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
    if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) { // 10MB
      return NextResponse.json({ 
        message: 'Размер данных слишком большой (максимум 10MB). Попробуйте уменьшить размер фотографий.', 
        error: 'Request too large'
      }, { status: 413 });
    }

    const json = await request.json();
    
    // Проверяем размер фотографий
    if (json.photos && Array.isArray(json.photos)) {
      const totalPhotoSize = json.photos.reduce((total: number, photo: string) => {
        if (photo && photo.startsWith('data:image/')) {
          const base64Data = photo.split(',')[1];
          return total + (base64Data ? (base64Data.length * 0.75) / 1024 : 0); // Размер в KB
        }
        return total;
      }, 0);

      if (totalPhotoSize > 2048) { // Больше 2MB в сумме
        return NextResponse.json({ 
          message: 'Общий размер фотографий слишком большой (максимум 2MB). Попробуйте уменьшить размер изображений.', 
          error: 'Photos too large'
        }, { status: 413 });
      }

      // Дополнительная проверка на количество фотографий
      if (json.photos.length > 3) {
        return NextResponse.json({ 
          message: 'Слишком много фотографий (максимум 3)', 
          error: 'Too many photos'
        }, { status: 400 });
      }
    }
    
    // Очищаем и валидируем фотографии перед обработкой
    if (json.photos && Array.isArray(json.photos)) {
      json.photos = cleanImageArray(json.photos);
      
      // Если все фотографии были отфильтрованы, устанавливаем пустой массив
      if (json.photos.length === 0) {
        console.warn('Все фотографии были отфильтрованы как невалидные');
        json.photos = [];
      }
    } else {
      // Если фотографии не переданы или не являются массивом, устанавливаем пустой массив
      json.photos = [];
    }
    
    // Автоматически устанавливаем продавца и дату заказа
    const newOrderData = {
      ...json,
      seller: user.username,
      orderDate: new Date().toISOString(),
    };
    
    // Валидируем данные с помощью Zod
    const validatedOrder = OrderSchema.omit({ id: true }).parse(newOrderData);

    // Вставляем заказ в базу данных с таймаутом
    const insertPromise = supabaseAdmin
      .from('orders')
      .insert(validatedOrder)
      .select()
      .single();

    // Устанавливаем таймаут 30 секунд для операции вставки
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Таймаут операции вставки')), 30000);
    });

    const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

    if (error) {
      // Специальная обработка ошибок Railway
      if (error.message && error.message.includes('response size limit')) {
        return NextResponse.json({ 
          message: 'Данные слишком большие для обработки. Попробуйте уменьшить размер фотографий.', 
          error: 'Railway response size limit exceeded'
        }, { status: 413 });
      }
      
      if (error.message && error.message.includes('client request body is buffered')) {
        return NextResponse.json({ 
          message: 'Запрос слишком большой. Попробуйте уменьшить размер данных.', 
          error: 'Request body too large for Railway'
        }, { status: 413 });
      }
      
      throw error;
    }

    // Парсим дату перед отправкой ответа
    const result = {
      ...data,
      orderDate: new Date(data.orderDate)
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
      message: 'Ошибка добавления заказа', 
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 