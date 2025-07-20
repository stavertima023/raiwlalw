import { NextRequest, NextResponse } from 'next/server';
import { supabase, fetchExpensesWithPagination } from '@/lib/serverConfig';
import { ExpenseSchema } from '@/lib/types';
import { compressImage, validateAndCleanBase64 } from '@/lib/imageUtils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Используем оптимизированный запрос с пагинацией
    const result = await fetchExpensesWithPagination(page, limit);
    
    return NextResponse.json({
      expenses: result.data,
      total: result.count,
      hasMore: result.hasMore,
      page,
      limit
    });
  } catch (error) {
    console.error('GET /api/expenses error:', error);
    return NextResponse.json(
      { error: 'Ошибка при получении расходов' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Валидация данных
    const validatedData = ExpenseSchema.omit({ id: true }).parse(body);
    
    // Обработка фотографий
    let processedPhotos: string[] = [];
    
    if (validatedData.photos && validatedData.photos.length > 0) {
      console.log(`Processing ${validatedData.photos.length} photos for expense`);
      
      for (let i = 0; i < validatedData.photos.length; i++) {
        const photo = validatedData.photos[i];
        
        try {
          // Проверяем, что фото не пустое
          if (!photo || photo.trim() === '') {
            console.warn(`Expense photo ${i} is empty, skipping`);
            continue;
          }

          // Валидируем и очищаем base64
          const cleanedPhoto = validateAndCleanBase64(photo);
          if (!cleanedPhoto) {
            console.warn(`Expense photo ${i} failed validation, skipping`);
            continue;
          }

          // Сжимаем изображение
          const compressedPhoto = await compressImage(cleanedPhoto);
          if (compressedPhoto) {
            processedPhotos.push(compressedPhoto);
            console.log(`Expense photo ${i} processed successfully`);
          } else {
            console.warn(`Expense photo ${i} compression failed, skipping`);
          }
        } catch (photoError) {
          console.error(`Error processing expense photo ${i}:`, photoError);
          // Продолжаем обработку других фото
        }
      }
    }

    // Создаем расход с обработанными фотографиями
    const expenseData = {
      ...validatedData,
      photos: processedPhotos,
      date: new Date().toISOString()
    };

    console.log('Creating expense with data:', {
      ...expenseData,
      photos: expenseData.photos ? `${expenseData.photos.length} photos` : 'no photos'
    });

    const { data, error } = await supabase
      .from('expenses')
      .insert([expenseData])
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Ошибка при создании расхода', details: error.message },
        { status: 400 }
      );
    }

    console.log('Expense created successfully:', data.id);
    return NextResponse.json({ expense: data }, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/expenses error:', error);
    
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
      { error: 'Ошибка при создании расхода' },
      { status: 500 }
    );
  }
} 