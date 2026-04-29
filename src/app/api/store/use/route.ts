import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { z } from 'zod';

const UseFromStoreSchema = z.object({
  orderId: z.string().min(1, 'ID заказа обязателен'),
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
    const { orderId } = UseFromStoreSchema.parse(body);

    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id, on_store, shipmentNumber')
      .eq('id', orderId)
      .single();

    if (findError || !order) {
      return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
    }

    if (!order.on_store) {
      return NextResponse.json({ message: 'Заказ не находится в магазине' }, { status: 400 });
    }

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ on_store: false })
      .eq('id', orderId)
      .select('id, shipmentNumber, on_store')
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      message: 'Заказ успешно использован из магазина',
      order: updated,
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Ошибка использования заказа', error: error.message }, { status: 500 });
  }
}
