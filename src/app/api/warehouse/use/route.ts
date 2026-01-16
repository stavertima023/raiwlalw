import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { z } from 'zod';

const UseFromWarehouseSchema = z.object({
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
    const { orderId } = UseFromWarehouseSchema.parse(body);

    // Проверяем, что заказ существует и находится на складе
    const { data: order, error: findError } = await supabaseAdmin
      .from('orders')
      .select('id, on_warehouse, shipmentNumber')
      .eq('id', orderId)
      .single();

    if (findError || !order) {
      return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
    }

    if (!order.on_warehouse) {
      return NextResponse.json({ message: 'Заказ не находится на складе' }, { status: 400 });
    }

    // Убираем заказ со склада (on_warehouse = false), статус не меняем
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update({ on_warehouse: false })
      .eq('id', orderId)
      .select('id, shipmentNumber, on_warehouse')
      .single();

    if (updateError) {
      throw updateError;
    }

    return NextResponse.json({
      message: 'Заказ успешно использован',
      order: updated
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Ошибка использования заказа', error: error.message }, { status: 500 });
  }
}
