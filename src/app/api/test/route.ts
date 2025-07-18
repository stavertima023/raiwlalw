import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    // Проверяем переменные окружения
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      supabaseAdmin: !!supabaseAdmin,
    };

    if (!supabaseAdmin) {
      return NextResponse.json({
        error: 'Supabase admin client not available',
        envCheck
      }, { status: 500 });
    }

    // Простой тест подключения
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);

    if (error) {
      return NextResponse.json({
        error: 'Database connection failed',
        details: error,
        envCheck
      }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Connection successful',
      envCheck,
      data
    });
  } catch (error) {
    console.error('Test API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 