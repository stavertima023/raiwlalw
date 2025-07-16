import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { PayoutStatusEnum } from '@/lib/types';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: PayoutStatusEnum,
});

export async function PATCH(request: Request, { params }: { params: { payoutId: string } }) {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  // Only admins can update payout status
  if (user.role !== 'Администратор') {
    return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }

  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const { payoutId } = params;
    const json = await request.json();
    const { status } = UpdateStatusSchema.parse(json);

    const { data, error } = await supabaseAdmin
      .from('payouts')
      .update({ status })
      .eq('id', payoutId)
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