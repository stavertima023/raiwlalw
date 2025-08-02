import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';
import { cleanImageArray } from '@/lib/imageUtils';
import { createThumbnailsServer } from '@/lib/imageUtilsServer';

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

    // Проверяем подключение к базе данных
    try {
      console.log('🔍 Проверяем подключение к базе данных...');
      const { data: testData, error: testError } = await supabaseAdmin
        .from('orders')
        .select('id')
        .limit(1);
      
      if (testError) {
        console.error('❌ Ошибка подключения к базе данных:', testError);
        return NextResponse.json({ 
          message: 'Ошибка подключения к базе данных', 
          error: testError.message 
        }, { status: 503 });
      }
      
      console.log('✅ Подключение к базе данных успешно');
    } catch (dbError) {
      console.error('❌ Критическая ошибка подключения к БД:', dbError);
      return NextResponse.json({ 
        message: 'Сервис базы данных недоступен', 
        error: 'Database connection failed' 
      }, { status: 503 });
    }

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

    // Создаем базовый запрос в зависимости от роли
    let query;
    if (user.role === 'Принтовщик' || user.role === 'Продавец') {
      // Для принтовщика и продавца НЕ загружаем фотографии в основном запросе
      // Они будут загружены отдельно через OrderPhotosLazy
      query = supabaseAdmin
        .from('orders')
        .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, comment, ready_at')
        .order('orderDate', { ascending: false });
      console.log(`📸 ИСКЛЮЧАЕМ фотографии из основного запроса для ${user.role} (будут загружены отдельно)`);
    } else {
      // Для админа и других ролей включаем фотографии в основной запрос
      query = supabaseAdmin
        .from('orders')
        .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at')
        .order('orderDate', { ascending: false });
      console.log(`📸 Включаем фотографии в основной запрос для ${user.role}`);
    }
    
    // Фильтруем по роли
    if (user.role === 'Продавец') {
      query = query.eq('seller', user.username);
      console.log(`📊 Фильтруем заказы для продавца: ${user.username}`);
    }
    
    // Ограничиваем количество для определенных ролей
    if (user.role === 'Принтовщик' || user.role === 'Продавец') {
      query = query.limit(200);
      console.log(`📊 Ограничиваем до 200 заказов для ${user.role}`);
    } else if (user.role === 'Администратор') {
      console.log(`📊 Загружаем ВСЕ заказы для Администратора`);
    } else {
      console.log(`📊 Загружаем все заказы для ${user.role}`);
    }
    
    console.log('🔍 Выполняем запрос к базе данных...');
    
    // Выполняем запрос
    let result;
    try {
      result = await query;
    } catch (queryError) {
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

    // Парсим даты и обрабатываем фотографии
    const processedData = await Promise.all(data.map(async (item) => {
      try {
        const processedItem = {
          ...item, 
          orderDate: new Date(item.orderDate)
        };

        // Для принтовщика и продавца НЕ обрабатываем фотографии
        // Они будут загружены отдельно через OrderPhotosLazy
        if (user.role === 'Принтовщик' || user.role === 'Продавец') {
          // Устанавливаем пустой массив фотографий
          (processedItem as any).photos = [];
          console.log(`📸 Устанавливаем пустой массив фотографий для заказа ${item.id} (${user.role})`);
        }

        return processedItem;
      } catch (dateError) {
        console.warn('⚠️ Ошибка обработки заказа:', item.id, dateError);
        return {
          ...item, 
          orderDate: new Date()
        };
      }
    }));

    console.log(`✅ Заказы обработаны: ${processedData.length} шт. для ${user.role}`);
    
    // Логируем размер ответа для мониторинга
    const responseSize = JSON.stringify(processedData).length;
    const responseSizeMB = (responseSize / (1024 * 1024)).toFixed(2);
    console.log(`📊 Размер ответа: ${responseSizeMB}MB для ${user.role}`);
    
    return NextResponse.json(processedData);
    
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