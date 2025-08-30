import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const maxDuration = 30;
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    console.log(`📸 Запрос фотографий для заказа: ${orderId}`);
    
    // Проверяем доступность Supabase
    if (!supabaseAdmin) {
      console.error('❌ SupabaseAdmin недоступен');
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
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
      return NextResponse.json({ message: 'Ошибка авторизации' }, { status: 401 });
    }

    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.error('❌ Пользователь не авторизован');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    console.log('✅ Пользователь авторизован:', { username: user.username, role: user.role });

    // Получаем фотографии заказа (теперь это массив URL)
    console.log(`🔍 Выполняем запрос фотографий (URL) для заказа ${orderId}...`);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('photos')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error(`❌ Ошибка получения фотографий для заказа ${orderId}:`, error);
      return NextResponse.json({ 
        message: 'Заказ не найден', 
        error: error.message 
      }, { status: 404 });
    }

    console.log(`📊 Данные получены для заказа ${orderId}:`, {
      hasData: !!data,
      hasPhotos: !!data?.photos,
      photosCount: data?.photos?.length || 0
    });

    if (!data || !data.photos) {
      console.log(`📸 Фотографии не найдены для заказа: ${orderId}`);
      return NextResponse.json({ thumbnails: [], fullPhotos: [] });
    }

    console.log(`✅ Фотографии (URL) получены для заказа ${orderId}: ${data.photos.length} шт.`);
    // На клиенте ожидаются раздельные массивы. Для совместимости формируем одинаковые URL.
    const urls: string[] = data.photos;
    const thumbnails = urls.map((u) => ({ type: 'thumbnail', data: u, size: 'url' }));
    const fullPhotos = urls.map((u) => ({ type: 'full', data: u, size: 'url' }));
    return NextResponse.json({ thumbnails, fullPhotos });
    
  } catch (error: any) {
    console.error('❌ Критическая ошибка API фотографий:', error);
    return NextResponse.json({ 
      message: 'Ошибка загрузки фотографий', 
      error: error.message
    }, { status: 500 });
  }
} 