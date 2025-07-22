import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const maxDuration = 15; // 15 секунд
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }
    
    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    // Получаем время последней синхронизации
    const { searchParams } = new URL(request.url);
    const lastSync = searchParams.get('lastSync');
    
    if (!lastSync) {
      return NextResponse.json({ message: 'Не указано время последней синхронизации' }, { status: 400 });
    }

    // Строим запрос для получения изменений
    let query = supabaseAdmin
      .from('orders')
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at')
      .gte('orderDate', lastSync) // Заказы созданные или измененные после lastSync
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
      ready_at: item.ready_at ? new Date(item.ready_at) : null
    }));

    return NextResponse.json({
      changes: parsedData,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ 
      message: 'Ошибка загрузки изменений', 
      error: error.message 
    }, { status: 500 });
  }
} 