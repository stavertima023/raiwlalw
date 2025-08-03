import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Тестирование подключения к базе данных...');
    
    // Проверяем доступность SupabaseAdmin
    if (!supabaseAdmin) {
      console.error('❌ SupabaseAdmin недоступен');
      return NextResponse.json({ 
        error: 'SupabaseAdmin недоступен',
        message: 'SUPABASE_SERVICE_ROLE_KEY не настроен'
      }, { status: 503 });
    }

    console.log('✅ SupabaseAdmin доступен');

    // Тестируем подключение к базе данных
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Ошибка подключения к базе данных:', error);
      return NextResponse.json({ 
        error: 'Ошибка подключения к базе данных',
        details: error.message,
        code: error.code
      }, { status: 500 });
    }

    console.log('✅ Подключение к базе данных успешно');
    
    return NextResponse.json({ 
      success: true,
      message: 'Подключение к базе данных работает',
      data: data
    });

  } catch (error: any) {
    console.error('❌ Критическая ошибка:', error);
    return NextResponse.json({ 
      error: 'Критическая ошибка',
      message: error.message,
      stack: error.stack
    }, { status: 500 });
  }
} 