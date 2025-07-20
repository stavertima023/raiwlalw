import { NextRequest, NextResponse } from 'next/server';
import { supabase, fetchOrdersWithPagination } from '@/lib/serverConfig';
import { orderSchema } from '@/lib/types';
import { compressImage, validateAndCleanBase64 } from '@/lib/imageUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Используем оптимизированный запрос с пагинацией
    const result = await fetchOrdersWithPagination(page, limit);
    
    return NextResponse.json({
      orders: result.data,
      total: result.count,
      hasMore: result.hasMore,
      page,
      limit
    });
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении заказов' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация данных
    const validatedData = orderSchema.parse(body);
    
    // Обработка фотографий
    let processedPhotos: string[] = [];
    
    if (validatedData.photos && validatedData.photos.length > 0) {
      console.log(`Processing ${validatedData.photos.length} photos`);
      
      for (let i = 0; i < validatedData.photos.length; i++) {
        const photo = validatedData.photos[i];
        
        try {
          // Проверяем, что фото не пустое
          if (!photo || photo.trim() === '') {
            console.warn(`Photo ${i} is empty, skipping`);
            continue;
          }

          // Валидируем и очищаем base64
          const cleanedPhoto = validateAndCleanBase64(photo);
          if (!cleanedPhoto) {
            console.warn(`Photo ${i} failed validation, skipping`);
            continue;
          }

          // Сжимаем изображение
          const compressedPhoto = await compressImage(cleanedPhoto);
          if (compressedPhoto) {
            processedPhotos.push(compressedPhoto);
            console.log(`Photo ${i} processed successfully`);
          } else {
            console.warn(`Photo ${i} compression failed, skipping`);
          }
        } catch (photoError) {
          console.error(`Error processing photo ${i}:`, photoError);
          // Продолжаем обработку других фото
        }
      }
    }

    // Создаем заказ с обработанными фотографиями
    const orderData = {
      ...validatedData,
      photos: processedPhotos,
      orderDate: new Date().toISOString()
    };

    console.log('Creating order with data:', {
      ...orderData,
      photos: orderData.photos ? `${orderData.photos.length} photos` : 'no photos'
    });

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Ошибка при создании заказа', details: error.message },
        { status: 400 }
      );
    }

    console.log('Order created successfully:', data.id);
    return NextResponse.json({ order: data }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/orders error:', error);
    
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { 
          error: 'Ошибка валидации данных',
          details: error.errors.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Ошибка при создании заказа' },
      { status: 500 }
    );
  }
} 