import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { z } from 'zod';

const CheckWarehouseSchema = z.object({
  shipmentNumbers: z.string().min(1, 'Номера отправлений обязательны'),
});

export async function POST(request: Request) {
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
    const body = await request.json();
    const { shipmentNumbers } = CheckWarehouseSchema.parse(body);

    // Парсим номера отправлений (разделители: пробел, запятая, перенос строки)
    const parsedNumbers = shipmentNumbers
      .split(/[\s,\n\r]+/)
      .map(n => n.trim())
      .filter(n => n.length > 0);

    if (parsedNumbers.length === 0) {
      return NextResponse.json({ message: 'Не найдено ни одного номера отправления' }, { status: 400 });
    }

    // Ищем заказы по номерам отправлений (БЕЗ ограничений - все заказы из БД)
    const { data: orders, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id, orderNumber, shipmentNumber, status, productType, size, photos, price, seller, comment')
      .in('shipmentNumber', parsedNumbers);

    if (findError) {
      throw findError;
    }

    const foundNumbers = (orders || []).map(o => o.shipmentNumber);
    const notFoundNumbers = parsedNumbers.filter(n => !foundNumbers.includes(n));

    return NextResponse.json({
      found: orders || [],
      foundCount: (orders || []).length,
      notFound: notFoundNumbers,
      notFoundCount: notFoundNumbers.length,
      requested: parsedNumbers.length
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Ошибка проверки заказов', error: error.message }, { status: 500 });
  }
}
