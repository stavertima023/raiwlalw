import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderStatusEnum } from '@/lib/types';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: OrderStatusEnum,
});

export async function PATCH(request: Request, { params }: { params: { orderId: string } }) {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
  }

  try {
    const { orderId } = params;
    const json = await request.json();
    const { status } = UpdateStatusSchema.parse(json);

    // First, get the current order to check permissions
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
    }

    // Check permissions based on user role
    if (user.role === 'Администратор') {
      // Admin can change any status
    } else if (user.role === 'Принтовщик') {
      // Printer can change any status
    } else if (user.role === 'Продавец') {
      // Seller can only modify their own orders
      if (currentOrder.seller !== user.username) {
        return NextResponse.json({ message: 'Вы можете изменять только свои заказы' }, { status: 403 });
      }

      // Seller can only cancel orders with status "Добавлен" or "Готов"
      if (status === 'Отменен') {
        if (currentOrder.status !== 'Добавлен' && currentOrder.status !== 'Готов') {
          return NextResponse.json({ 
            message: 'Можно отменять только заказы со статусом "Добавлен" или "Готов"' 
          }, { status: 403 });
        }
      }
      // Seller can only return orders with status "Отправлен"
      else if (status === 'Возврат') {
        if (currentOrder.status !== 'Отправлен') {
          return NextResponse.json({ 
            message: 'Можно оформлять возврат только для заказов со статусом "Отправлен"' 
          }, { status: 403 });
        }
      }
      // Seller cannot set other statuses
      else {
        return NextResponse.json({ 
          message: 'Продавец может только отменять или оформлять возврат заказов' 
        }, { status: 403 });
      }
    } else {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
     if (error.name === 'ZodError') {
       return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Ошибка обновления статуса', error: error.message }, { status: 500 });
  }
} 