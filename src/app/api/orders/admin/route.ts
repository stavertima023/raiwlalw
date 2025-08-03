import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

// Увеличиваем лимиты для админ API
export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Начало обработки GET запроса /api/orders/admin');
    
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

    // Проверяем, что пользователь является администратором
    if (user.role !== 'Администратор') {
      console.error('❌ Доступ запрещен для роли:', user.role);
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    console.log('✅ Администратор авторизован:', { username: user.username, role: user.role });

    // Создаем оптимизированный запрос БЕЗ фотографий для быстрой загрузки
    let query = supabaseAdmin
      .from('orders')
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, comment, ready_at')
      .order('orderDate', { ascending: false });

    console.log('🔍 Выполняем оптимизированный запрос к базе данных (без фотографий)...');
    
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
      console.error(`❌ Ошибка запроса заказов для админа:`, error);
      return NextResponse.json({ 
        message: 'Ошибка загрузки заказов', 
        error: error.message 
      }, { status: 500 });
    }

    console.log('✅ Данные получены из БД, обрабатываем...');

    // Проверяем данные
    if (!data) {
      console.log(`📊 Нет данных для админа, возвращаем пустой массив`);
      return NextResponse.json([]);
    }

    if (!Array.isArray(data)) {
      console.log(`📊 Данные не являются массивом для админа, возвращаем пустой массив`);
      return NextResponse.json([]);
    }

    // Парсим даты и добавляем пустой массив фотографий
    const parsedData = data.map(item => {
      try {
        return {
          ...item, 
          orderDate: new Date(item.orderDate),
          photos: [] // Пустой массив фотографий для оптимизации
        };
      } catch (dateError) {
        console.warn('⚠️ Ошибка парсинга даты для заказа:', item.id, dateError);
        return {
          ...item, 
          orderDate: new Date(),
          photos: []
        };
      }
    });

    console.log(`✅ Заказы получены: ${parsedData.length} шт. для админа (без фотографий)`);
    return NextResponse.json(parsedData);
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка админ API заказов:', error);
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