import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderStatusEnum, OrderStatus } from '@/lib/types';
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

    // For sellers, check if they own the order and only allow certain status changes
    if (user.role === 'Продавец') {
      // First, get the order to check ownership
      const { data: orderData, error: fetchError } = await supabaseAdmin
        .from('orders')
        .select('seller, status')
        .eq('id', orderId)
        .single();

      if (fetchError || !orderData) {
        return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
      }

      // Check if seller owns this order
      if (orderData.seller !== user.username) {
        return NextResponse.json({ message: 'Доступ запрещен: вы можете изменять только свои заказы' }, { status: 403 });
      }

      // Sellers can only cancel orders that are "Добавлен" or "Готов", and return orders that are "Отправлен"
      const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
        'Добавлен': ['Отменен'],
        'Готов': ['Отменен'],
        'Отправлен': ['Возврат'],
        'Исполнен': [],
        'Отменен': [],
        'Возврат': []
      };

      const currentStatus = orderData.status as OrderStatus;
      const allowedStatuses = allowedTransitions[currentStatus] || [];

      if (!allowedStatuses.includes(status)) {
        return NextResponse.json({ 
          message: `Невозможно изменить статус с "${currentStatus}" на "${status}"` 
        }, { status: 403 });
      }
    } else if (user.role !== 'Администратор' && user.role !== 'Принтовщик') {
      // Other roles (not seller, admin, or printer) are not allowed
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