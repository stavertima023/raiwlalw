import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderStatusEnum } from '@/lib/types';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: OrderStatusEnum,
});

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    console.log(`🔄 Обновление заказа ${orderId}...`);
    
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

    // Обновляем заказ
    console.log(`🔍 Выполняем обновление заказа ${orderId}...`);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update(body)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error(`❌ Ошибка обновления заказа ${orderId}:`, error);
      return Response.json({ 
        message: 'Ошибка обновления заказа', 
        error: error.message 
      }, { status: 500 });
    }

    console.log(`✅ Заказ ${orderId} успешно обновлен:`, data);
    return Response.json(data);
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка API обновления заказа:', error);
    return Response.json({ 
      message: 'Ошибка обновления заказа', 
      error: error.message
    }, { status: 500 });
  }
} 