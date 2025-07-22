import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const maxDuration = 30; // 30 секунд
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

    // Получаем параметры пагинации из URL
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200); // Максимум 200 записей за раз
    const offset = (page - 1) * limit;
    
    // Получаем фильтры
    const status = searchParams.get('status');
    const seller = searchParams.get('seller');
    const orderNumber = searchParams.get('orderNumber');
    const sortBy = searchParams.get('sortBy') || 'orderDate';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Строим базовый запрос
    let query = supabaseAdmin
      .from('orders')
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at', { count: 'exact' });

    // Применяем фильтры
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
    
    if (seller && seller !== 'all') {
      query = query.eq('seller', seller);
    }
    
    if (orderNumber) {
      query = query.ilike('orderNumber', `%${orderNumber}%`);
    }

    // Если пользователь продавец, фильтруем только его заказы
    if (user.role === 'Продавец') {
      query = query.eq('seller', user.username);
    }

    // Применяем сортировку
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Применяем пагинацию
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

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
      data: parsedData,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasNext: offset + limit < (count || 0),
        hasPrev: page > 1
      }
    });
  } catch (error: any) {
    return NextResponse.json({ 
      message: 'Ошибка загрузки заказов', 
      error: error.message 
    }, { status: 500 });
  }
} 