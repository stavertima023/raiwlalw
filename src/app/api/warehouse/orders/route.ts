import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  if (user.role !== 'Принтовщик') {
    return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
  }

  try {
    // Получаем ВСЕ заказы на складе (без ограничений)
    const { data: orders, error } = await supabaseAdmin
      .from('orders')
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at, printerChecked, on_warehouse')
      .eq('on_warehouse', true)
      .order('orderDate', { ascending: false });

    if (error) {
      throw error;
    }

    // Парсим даты
    const parsedData = (orders || []).map((item: any) => ({
      ...item,
      orderDate: new Date(item.orderDate)
    }));

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ 
      message: 'Ошибка загрузки заказов со склада', 
      error: error.message 
    }, { status: 500 });
  }
}
