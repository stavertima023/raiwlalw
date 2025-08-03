import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Тестирование сессии...');
    
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
      return NextResponse.json({ 
        error: 'Ошибка получения сессии',
        details: sessionError instanceof Error ? sessionError.message : 'Unknown error'
      }, { status: 500 });
    }

    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.log('❌ Пользователь не авторизован');
      return NextResponse.json({ 
        error: 'Пользователь не авторизован',
        session: session
      }, { status: 401 });
    }

    console.log('✅ Пользователь авторизован:', { username: user.username, role: user.role });
    
    return NextResponse.json({ 
      success: true,
      message: 'Сессия работает корректно',
      user: {
        username: user.username,
        role: user.role,
        name: user.name
      }
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