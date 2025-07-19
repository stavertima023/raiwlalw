import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';

export async function middleware(request: NextRequest) {
  // Пропускаем debug страницу
  if (request.nextUrl.pathname === '/debug') {
    return NextResponse.next();
  }

  // Проверяем размер запроса для API endpoints
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const contentLength = request.headers.get('content-length');
    
    // Увеличиваем лимит до 15MB для API запросов
    if (contentLength && parseInt(contentLength) > 15 * 1024 * 1024) {
      return NextResponse.json(
        { 
          message: 'Размер запроса слишком большой (максимум 15MB)',
          error: 'Request too large'
        },
        { status: 413 }
      );
    }

    // Добавляем заголовки для увеличения лимитов
    const response = NextResponse.next();
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }

  // Проверяем аутентификацию для защищенных маршрутов
  if (request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/admin')) {
    
    try {
      const session = await getIronSession(request, NextResponse.next(), sessionOptions);
      
      if (!session || !(session as any).isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } catch (error) {
      console.error('Session error in middleware:', error);
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/dashboard/:path*',
    '/admin/:path*',
    '/debug',
  ],
}; 