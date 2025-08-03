import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Admin API: Начало обработки запроса');
    
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    if (user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    console.log('✅ Admin API: Администратор авторизован');

    // Оптимизированный запрос БЕЗ фотографий
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, comment, ready_at')
      .order('orderDate', { ascending: false });

    if (error) {
      console.error('❌ Admin API: Ошибка запроса:', error);
      return NextResponse.json({ 
        message: 'Ошибка загрузки заказов', 
        error: error.message 
      }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json([]);
    }

    // Парсим даты и добавляем пустой массив фотографий
    const parsedData = data.map(item => ({
      ...item, 
      orderDate: new Date(item.orderDate),
      photos: [] // Пустой массив для оптимизации
    }));

    console.log(`✅ Admin API: Заказы получены: ${parsedData.length} шт.`);
    return NextResponse.json(parsedData);
    
  } catch (error: any) {
    console.error('❌ Admin API: Критическая ошибка:', error);
    return NextResponse.json({ 
      message: 'Критическая ошибка загрузки заказов', 
      error: error.message
    }, { status: 500 });
  }
} 