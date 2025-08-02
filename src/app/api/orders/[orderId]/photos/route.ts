import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { createThumbnailsServer } from '@/lib/imageUtilsServer';

export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    console.log('🖼️ Начало обработки GET запроса /api/orders/[orderId]/photos');
    
    // Проверяем доступность Supabase
    if (!supabaseAdmin) {
      console.error('❌ SupabaseAdmin недоступен');
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    // Получаем сессию
    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.error('❌ Пользователь не авторизован');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    const { orderId } = params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'full'; // 'thumbnails' или 'full'

    console.log(`📸 Запрос фотографий для заказа ${orderId}, тип: ${type}, роль: ${user.role}`);

    // Получаем заказ с фотографиями
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, photos, seller')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ Ошибка получения заказа:', error);
      return NextResponse.json({ 
        message: 'Заказ не найден', 
        error: error.message 
      }, { status: 404 });
    }

    if (!order) {
      console.error('❌ Заказ не найден');
      return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
    }

    // Проверяем права доступа
    if (user.role === 'Продавец' && order.seller !== user.username) {
      console.error('❌ Продавец не имеет доступа к заказу');
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const photos = order.photos || [];

    if (type === 'thumbnails') {
      // Создаем thumbnails для фотографий
      console.log(`🖼️ Создание thumbnails для ${photos.length} фотографий...`);
      
      try {
        const thumbnails = await createThumbnailsServer(photos, 150, 150, 70);
        
        const thumbnailData = thumbnails.map((thumbnail, index) => ({
          type: 'thumbnail',
          data: thumbnail,
          size: '150x150',
          originalIndex: index
        }));

        console.log(`✅ Создано ${thumbnailData.length} thumbnails для заказа ${orderId}`);
        return NextResponse.json({ thumbnails: thumbnailData });
      } catch (thumbnailError) {
        console.error('❌ Ошибка создания thumbnails:', thumbnailError);
        // В случае ошибки возвращаем оригинальные фотографии
        const fallbackThumbnails = photos.map((photo: string, index: number) => ({
          type: 'thumbnail',
          data: photo,
          size: 'original',
          originalIndex: index
        }));
        return NextResponse.json({ thumbnails: fallbackThumbnails });
      }
    } else {
      // Для full-size возвращаем оригинальные фотографии
      const fullPhotos = photos.map((photo: string, index: number) => ({
        type: 'full',
        data: photo,
        size: 'original',
        originalIndex: index
      }));

      console.log(`✅ Возвращено ${fullPhotos.length} full-size фотографий для заказа ${orderId}`);
      return NextResponse.json({ fullPhotos });
    }

  } catch (error: any) {
    console.error('❌ Критическая ошибка API фотографий:', error);
    return NextResponse.json({ 
      message: 'Ошибка загрузки фотографий', 
      error: error.message
    }, { status: 500 });
  }
} 