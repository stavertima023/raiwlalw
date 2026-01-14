import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';
import { uploadBase64ToStorage } from '@/lib/storage';
import { cleanImageArray } from '@/lib/imageUtils';

// Увеличиваем лимиты для этого API
export const maxDuration = 120; // 120 секунд (увеличено с 90)
export const dynamic = 'force-dynamic';

// Определяем мобильное устройство
const isMobile = (userAgent: string) => {
  return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
};

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Начало обработки GET запроса /api/orders');
    
    // Проверяем доступность Supabase
    if (!supabaseAdmin) {
      console.error('❌ SupabaseAdmin недоступен');
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }
    console.log('✅ SupabaseAdmin доступен');

    // Получаем сессию
    let session;
    try {
      session = await getSession();
      console.log('📋 Сессия получена:', { 
        isLoggedIn: session.isLoggedIn, 
        hasUser: !!session.user,
        userRole: session.user?.role 
      });
    } catch (sessionError) {
      console.error('❌ Ошибка получения сессии:', sessionError);
      return NextResponse.json({ message: 'Ошибка авторизации' }, { status: 401 });
    }

    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.error('❌ Пользователь не авторизован');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    console.log('✅ Пользователь авторизован:', { username: user.username, role: user.role });

    // Получаем User-Agent для определения мобильного устройства
    const userAgent = request.headers.get('user-agent') || '';
    const mobile = isMobile(userAgent);

    console.log(`📱 Запрос заказов с ${mobile ? 'мобильного' : 'десктопного'} устройства для роли: ${user.role}`);

    // Создаем базовый запрос с разными полями в зависимости от роли
    let selectFields;
    if (user.role === 'Администратор') {
      // Для админа НЕ загружаем фотографии вообще
      selectFields = 'id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, comment, ready_at, printerChecked';
    } else if (user.role === 'Продавец') {
      // Для продавцов фото будут только у последних 50 записей
      selectFields = 'id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at, printerChecked';
    } else {
      // Для Принтовщика без изменений (все фото)
      selectFields = 'id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at, printerChecked';
    }
    
    let query = supabaseAdmin
      .from('orders')
      .select(selectFields)
      .order('orderDate', { ascending: false });

    // Фильтруем по роли
    if (user.role === 'Продавец') {
      query = query.eq('seller', user.username);
      console.log(`📊 Фильтруем заказы для продавца: ${user.username}`);
    }
    
    // Ограничиваем количество для определенных ролей
    if (user.role === 'Принтовщик') {
      query = query.limit(1200);
      console.log(`📊 Ограничиваем до 1200 заказов для ${user.role}`);
    } else if (user.role === 'Продавец') {
      query = query.limit(300);
      console.log(`📊 Ограничиваем до 300 заказов для ${user.role}`);
    } else if (user.role === 'Администратор') {
      // Для админа загружаем ВСЕ заказы без ограничений (но без фотографий)
      console.log(`📊 Загружаем ВСЕ заказы для Администратора (без фотографий)`);
    } else {
      console.log(`📊 Загружаем все заказы для ${user.role}`);
    }
    
    console.log('🔍 Выполняем запрос к базе данных...');

    // Небольшая обертка с ретраями для сетевых обрывов (terminated/ECONNRESET)
    const retry = async <T>(fn: () => Promise<T>, attempts = 2): Promise<T> => {
      let lastErr: any = null;
      for (let i = 0; i <= attempts; i += 1) {
        try {
          return await fn();
        } catch (e: any) {
          lastErr = e;
          const msg = String(e?.message || e);
          if (/(terminated|ECONNRESET|socket hang up|fetch failed|network)/i.test(msg) && i < attempts) {
            await new Promise(r => setTimeout(r, 400 * (i + 1)));
            continue;
          }
          break;
        }
      }
      throw lastErr;
    };

    // Выполняем запрос с ретраями
    let result;
    try {
      result = await retry(() => query as unknown as Promise<any>, 2);
    } catch (queryError: any) {
      console.error('❌ Ошибка выполнения запроса:', queryError);
      return NextResponse.json({ 
        message: 'Ошибка базы данных', 
        error: queryError instanceof Error ? queryError.message : 'Unknown error'
      }, { status: 500 });
    }

    const { data, error } = result;

    if (error) {
      console.error(`❌ Ошибка запроса заказов для ${user.role}:`, error);
      return NextResponse.json({ 
        message: 'Ошибка загрузки заказов', 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Данные получены из БД, обрабатываем...');

    // Проверяем данные
    if (!data) {
      console.log(`📊 Нет данных для ${user.role}, возвращаем пустой массив`);
      return NextResponse.json([]);
    }

    if (!Array.isArray(data)) {
      console.log(`📊 Данные не являются массивом для ${user.role}, возвращаем пустой массив`);
      return NextResponse.json([]);
    }

    // Парсим даты
    let parsedData = data.map((item: any) => {
      try {
        return {
          ...item, 
          orderDate: new Date(item.orderDate)
        };
      } catch (dateError) {
        console.warn('⚠️ Ошибка парсинга даты для заказа:', item.id, dateError);
        return {
          ...item, 
          orderDate: new Date()
        };
      }
    });

    // Для продавцов: оставляем фото только у последних 50 заказов, остальные 150 — без фото
    if (user.role === 'Продавец') {
      const withPhotos = new Set(parsedData.slice(0, 50).map((o: any) => o.id));
      parsedData = parsedData.map((o: any) => ({
        ...o,
        photos: withPhotos.has(o.id) ? o.photos : [],
      }));
    }

    console.log(`✅ Заказы получены: ${parsedData.length} шт. для ${user.role}`);
    return NextResponse.json(parsedData);
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка API заказов:', error);
    console.error('❌ Детали ошибки:', {
      message: error.message,
      stack: error.stack,
      code: error.code,
      details: error.details,
      hint: error.hint
    });
    
    return NextResponse.json({ 
      message: 'Критическая ошибка загрузки заказов', 
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

    // Проверяем размер запроса (уменьшен до 10MB)
    const contentLength = request.headers.get('content-length');
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      if (sizeInMB > 10) { // 10MB лимит (уменьшен с 15MB)
        return NextResponse.json({ 
          message: 'Размер запроса слишком большой (максимум 10MB)', 
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
      if (totalSizeInMB > 4) { // 4MB лимит для всех фотографий (уменьшен с 6MB)
        return NextResponse.json({ 
          message: 'Общий размер фотографий слишком большой (максимум 4MB)', 
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
            
            if (photoSizeInMB > 1.5) { // 1.5MB лимит для одной фотографии (уменьшен с 2MB)
              return NextResponse.json({ 
                message: `Фотография ${i + 1} слишком большая (максимум 1.5MB)`, 
                error: `Размер: ${photoSizeInMB.toFixed(2)}MB`,
                recommendation: 'Попробуйте сжать изображение перед загрузкой'
              }, { status: 413 });
            }
          }
        }
      }

      json.photos = cleanImageArray(json.photos);
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

    // 1) Вставляем заказ без фотографий (временно)
    const { photos: base64Photos, ...rest } = validatedOrder as any;
    const { data: created, error: createError } = await supabaseAdmin
      .from('orders')
      .insert({ ...rest, photos: [] })
      .select('id, seller, orderDate, orderNumber, shipmentNumber, status, productType, size, price, cost, comment, ready_at, printerChecked')
      .single();
    if (createError) throw createError;

    // 2) Если были фотографии — загружаем в Storage, сохраняем URL в orders.photos
    if (Array.isArray(base64Photos) && base64Photos.length > 0) {
      const uploaded: string[] = [];
      let index = 0;
      for (const b64 of base64Photos) {
        try {
          const result = await uploadBase64ToStorage({
            base64: b64,
            orderId: created.id,
            seller: user.username,
            index,
          });
          uploaded.push(result.publicUrl);
          index += 1;
        } catch (e) {
          console.warn('Не удалось загрузить фото в Storage:', e);
        }
      }
      if (uploaded.length > 0) {
        const { error: updatePhotosError } = await supabaseAdmin
          .from('orders')
          .update({ photos: uploaded })
          .eq('id', created.id);
        if (updatePhotosError) throw updatePhotosError;
      }
    }

    // Note: remove stray error rethrow; all errors above are handled explicitly

    // Парсим дату перед отправкой ответа
    const { data: finalRow } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', created.id)
      .single();
    const result = { ...finalRow, orderDate: new Date(finalRow.orderDate) };

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