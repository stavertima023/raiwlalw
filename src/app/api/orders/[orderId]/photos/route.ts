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
    console.log(`📸 API: Запрос фотографий для заказа: ${params.orderId}`);
    
    // Проверяем доступность Supabase
    if (!supabaseAdmin) {
      console.error('❌ API: SupabaseAdmin недоступен');
      return NextResponse.json({ photos: [] });
    }

    // Получаем сессию
    let session;
    try {
      session = await getSession();
    } catch (sessionError) {
      console.error('❌ API: Ошибка получения сессии:', sessionError);
      return NextResponse.json({ photos: [] });
    }

    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.error('❌ API: Пользователь не авторизован');
      return NextResponse.json({ photos: [] });
    }

    console.log('✅ API: Пользователь авторизован:', { username: user.username, role: user.role });

    // Получаем фотографии заказа
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('photos')
      .eq('id', params.orderId)
      .single();

    if (error) {
      console.error('❌ API: Ошибка получения фотографий:', error);
      return NextResponse.json({ photos: [] });
    }

    if (!data || !data.photos) {
      console.log('📸 API: Фотографии не найдены для заказа:', params.orderId);
      return NextResponse.json({ photos: [] });
    }

    console.log(`✅ API: Фотографии получены для заказа ${params.orderId}: ${data.photos.length} шт.`);
    return NextResponse.json({ photos: data.photos });
    
  } catch (error: any) {
    console.error('❌ API: Критическая ошибка:', error);
    return NextResponse.json({ photos: [] });
  }
} 