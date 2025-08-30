import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getSession } from '@/lib/session';

export async function PATCH(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    console.log(`🔄 Обновление отметки принтовщика для заказа ${orderId}...`);
    
    const body = await request.json();
    const { checked } = body;
    
    console.log('📋 Тело запроса:', { orderId, checked });
    
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

    // Проверяем роль пользователя
    if (user.role !== 'Принтовщик') {
      console.error('❌ Доступ запрещен для роли:', user.role);
      return Response.json({ message: 'Доступ запрещен: только принтовщики могут отмечать заказы' }, { status: 403 });
    }

    console.log('✅ Пользователь авторизован:', { username: user.username, role: user.role });

    // Обновляем отметку принтовщика
    console.log(`🔍 Выполняем обновление отметки принтовщика для заказа ${orderId}...`);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ printerChecked: checked })
      .eq('id', orderId)
      .select('id, printerChecked')
      .single();

    if (error) {
      console.error(`❌ Ошибка обновления отметки принтовщика для заказа ${orderId}:`, error);
      return Response.json({ 
        message: 'Ошибка обновления отметки', 
        error: error.message 
      }, { status: 500 });
    }

    console.log(`✅ Отметка принтовщика для заказа ${orderId} успешно обновлена:`, data);
    return Response.json(data);
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка API обновления отметки принтовщика:', error);
    return Response.json({ 
      message: 'Ошибка обновления отметки', 
      error: error.message
    }, { status: 500 });
  }
}
