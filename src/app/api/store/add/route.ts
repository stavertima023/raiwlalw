import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { z } from 'zod';

const AddToStoreSchema = z.object({
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
    const { shipmentNumbers } = AddToStoreSchema.parse(body);

    const parsedNumbers = shipmentNumbers
      .split(/[\s,\n\r]+/)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (parsedNumbers.length === 0) {
      return NextResponse.json({ message: 'Не найдено ни одного номера отправления' }, { status: 400 });
    }

    const { data: orders, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id, shipmentNumber, status')
      .in('shipmentNumber', parsedNumbers);

    if (findError) throw findError;

    if (!orders || orders.length === 0) {
      return NextResponse.json(
        { message: 'Заказы с указанными номерами отправлений не найдены', found: 0, requested: parsedNumbers.length },
        { status: 404 }
      );
    }

    const orderIds = orders.map((o) => o.id);
    const foundNumbers = orders.map((o) => o.shipmentNumber);
    const notFoundNumbers = parsedNumbers.filter((n) => !foundNumbers.includes(n));

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({
        status: 'Магазин',
        on_store: true,
        on_warehouse: false,
      })
      .in('id', orderIds)
      .select('id, shipmentNumber, status, on_store');

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Заказы успешно добавлены в магазин',
      added: updated?.length || 0,
      requested: parsedNumbers.length,
      notFound: notFoundNumbers,
      orders: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Ошибка добавления в магазин', error: error.message }, { status: 500 });
  }
}
