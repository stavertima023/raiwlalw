import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    console.log(`📸 Запрос фотографий для заказа: ${params.orderId}`);
    
    // Проверяем доступность Supabase
    if (!supabaseAdmin) {
      console.error('❌ SupabaseAdmin недоступен');
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    // Получаем сессию
    let session;
    try {
      session = await getSession();
    } catch (sessionError) {
      console.error('❌ Ошибка получения сессии:', sessionError);
      return NextResponse.json({ message: 'Ошибка авторизации' }, { status: 401 });
    }

    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.error('❌ Пользователь не авторизован');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    console.log('✅ Пользователь авторизован:', { username: user.username, role: user.role });

    // Получаем фотографии заказа
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('photos')
      .eq('id', params.orderId)
      .single();

    if (error) {
      console.error('❌ Ошибка получения фотографий:', error);
      return NextResponse.json({ 
        message: 'Заказ не найден', 
        error: error.message 
      }, { status: 404 });
    }

    if (!data || !data.photos) {
      console.log('📸 Фотографии не найдены для заказа:', params.orderId);
      return NextResponse.json({ photos: [] });
    }

    console.log(`✅ Фотографии получены для заказа ${params.orderId}: ${data.photos.length} шт.`);
    return NextResponse.json({ photos: data.photos });
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка API фотографий:', error);
    return NextResponse.json({ 
      message: 'Ошибка загрузки фотографий', 
      error: error.message
    }, { status: 500 });
  }
} 