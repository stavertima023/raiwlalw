import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { PayoutStatusEnum } from '@/lib/types';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: PayoutStatusEnum,
});

export async function PATCH(request: Request, { params }: { params: Promise<{ payoutId: string }> }) {
  try {
    const { payoutId } = await params;
    console.log(`🔄 Обновление статуса выплаты ${payoutId}...`);
    
    const body = await request.json();
    console.log('📋 Тело запроса:', body);
    
    // Проверяем доступность Supabase
    if (!supabaseAdmin) {
      console.error('❌ SupabaseAdmin недоступен');
      return Response.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    // Получаем сессию
    let session;
    try {
      session = await getSession();
      console.log('📋 Сессия получена:', { 
        isLoggedIn: session.isLoggedIn, 
        hasUser: !!session.user,
        userRole: session.user?.role 
      });
    } catch (sessionError) {
      console.error('❌ Ошибка получения сессии:', sessionError);
      return Response.json({ message: 'Ошибка авторизации' }, { status: 401 });
    }

    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.error('❌ Пользователь не авторизован');
      return Response.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    console.log('✅ Пользователь авторизован:', { username: user.username, role: user.role });

    // Обновляем статус выплаты
    console.log(`🔍 Выполняем обновление статуса выплаты ${payoutId}...`);
    const { data, error } = await supabaseAdmin
      .from('payouts')
      .update(body)
      .eq('id', payoutId)
      .select()
      .single();

    if (error) {
      console.error(`❌ Ошибка обновления выплаты ${payoutId}:`, error);
      return Response.json({ 
        message: 'Ошибка обновления выплаты', 
        error: error.message 
      }, { status: 500 });
    }

    console.log(`✅ Выплата ${payoutId} успешно обновлена:`, data);
    return Response.json(data);
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка API обновления выплаты:', error);
    return Response.json({ 
      message: 'Ошибка обновления выплаты', 
      error: error.message
    }, { status: 500 });
  }
} 