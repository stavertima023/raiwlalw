import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderStatusEnum } from '@/lib/types';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: OrderStatusEnum,
});

export async function PATCH(request: Request, { params }: { params: { orderId: string } }) {
  // Check if Supabase is configured
  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Supabase не настроен' }, { status: 503 });
  }

  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  // Only Admin or Printer can change status
  if (user.role !== 'Администратор' && user.role !== 'Принтовщик') {
     return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    const { orderId } = params;
    const json = await request.json();
    const { status } = UpdateStatusSchema.parse(json);

    const { data, error } = await supabaseAdmin!
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