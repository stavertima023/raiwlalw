import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Тестирование переменных окружения...');
    
    const envVars = {
      SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET',
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
      VERCEL_ENV: process.env.VERCEL_ENV,
    };

    console.log('📋 Переменные окружения:', envVars);
    
    // Проверяем критически важные переменные
    const missingVars = [];
    if (!process.env.SESSION_SECRET) missingVars.push('SESSION_SECRET');
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) missingVars.push('SUPABASE_SERVICE_ROLE_KEY');

    if (missingVars.length > 0) {
      console.error('❌ Отсутствуют переменные окружения:', missingVars);
      return NextResponse.json({ 
        error: 'Отсутствуют переменные окружения',
        missing: missingVars,
        envVars: envVars
      }, { status: 500 });
    }

    console.log('✅ Все переменные окружения настроены');
    
    return NextResponse.json({ 
      success: true,
      message: 'Переменные окружения настроены корректно',
      envVars: envVars
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