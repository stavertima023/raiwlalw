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

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const { orderId } = params;
    const json = await request.json();
    const { status } = UpdateStatusSchema.parse(json);

    // First, get the current order to check ownership and current status
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError || !currentOrder) {
      return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
    }

    // Authorization logic based on user role
    if (user.role === 'Администратор') {
      // Admin can change any order to any status
    } else if (user.role === 'Принтовщик') {
      // Printer can change any order status (existing behavior)
    } else if (user.role === 'Продавец') {
      // Seller can only modify their own orders with specific rules
      if (currentOrder.seller !== user.username) {
        return NextResponse.json({ message: 'Доступ запрещен: вы можете изменять только свои заказы' }, { status: 403 });
      }

      // Check if the status change is allowed for sellers
      if (status === 'Отменен') {
        // Can cancel orders with status "Добавлен" or "Готов"
        if (currentOrder.status !== 'Добавлен' && currentOrder.status !== 'Готов') {
          return NextResponse.json({ 
            message: `Нельзя отменить заказ со статусом "${currentOrder.status}". Отмена доступна только для заказов со статусом "Добавлен" или "Готов".` 
          }, { status: 403 });
        }
      } else if (status === 'Возврат') {
        // Can return orders with status "Отправлен"
        if (currentOrder.status !== 'Отправлен') {
          return NextResponse.json({ 
            message: `Нельзя оформить возврат для заказа со статусом "${currentOrder.status}". Возврат доступен только для заказов со статусом "Отправлен".` 
          }, { status: 403 });
        }
      } else {
        // Sellers cannot change orders to other statuses
        return NextResponse.json({ 
          message: 'Доступ запрещен: продавцы могут только отменять свои заказы или оформлять возврат' 
        }, { status: 403 });
      }
    } else {
      // Any other role is not allowed
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    // Update the order status
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at')
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