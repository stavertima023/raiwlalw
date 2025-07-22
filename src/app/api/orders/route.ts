import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';
import { cleanImageArray } from '@/lib/imageUtils';

// Увеличиваем лимиты для этого API
export const maxDuration = 90; // 90 секунд
export const dynamic = 'force-dynamic';

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
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at')
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
      orderDate: new Date(item.orderDate),
      ready_at: item.ready_at ? new Date(item.ready_at) : undefined
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

    // Проверяем размер запроса (увеличен до 15MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeInMB > 15) { // 15MB лимит
        return NextResponse.json({ 
          message: 'Размер запроса слишком большой (максимум 15MB)', 
          error: `Размер: ${sizeInMB.toFixed(2)}MB`
        }, { status: 413 });
      }
    }

    const json = await request.json();
    
    // Очищаем и валидируем фотографии перед обработкой
    if (json.photos && Array.isArray(json.photos)) {
      // Проверяем размер каждой фотографии
      const totalPhotoSize = json.photos.reduce((total: number, photo: string) => {
        if (photo && typeof photo === 'string') {
          const base64Data = photo.split(',')[1];
          if (base64Data) {
            return total + Math.ceil((base64Data.length * 3) / 4);
          }
        }
        return total;
      }, 0);

      const totalSizeInMB = totalPhotoSize / (1024 * 1024);
      if (totalSizeInMB > 6) { // 6MB лимит для всех фотографий (уменьшен для предотвращения ошибок Kong)
        return NextResponse.json({ 
          message: 'Общий размер фотографий слишком большой (максимум 6MB)', 
          error: `Размер: ${totalSizeInMB.toFixed(2)}MB`,
          recommendation: 'Попробуйте уменьшить качество или количество фотографий'
        }, { status: 413 });
      }

      // Дополнительная проверка отдельных фотографий
      for (let i = 0; i < json.photos.length; i++) {
        const photo = json.photos[i];
        if (photo && typeof photo === 'string') {
          const base64Data = photo.split(',')[1];
          if (base64Data) {
            const photoSize = Math.ceil((base64Data.length * 3) / 4);
            const photoSizeInMB = photoSize / (1024 * 1024);
            
            if (photoSizeInMB > 2) { // 2MB лимит для одной фотографии
              return NextResponse.json({ 
                message: `Фотография ${i + 1} слишком большая (максимум 2MB)`, 
                error: `Размер: ${photoSizeInMB.toFixed(2)}MB`,
                recommendation: 'Попробуйте сжать изображение перед загрузкой'
              }, { status: 413 });
            }
          }
        }
      }

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

    // Вставляем заказ в базу данных
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(validatedOrder)
      .select()
      .single();

    if (error) {
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