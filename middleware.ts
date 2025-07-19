import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSession } from '@/lib/session';

export async function middleware(request: NextRequest) {
  // Увеличиваем лимиты для API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const response = NextResponse.next();
    
    // Увеличиваем лимиты для больших запросов (обновлено для предотвращения ошибок Kong)
    response.headers.set('X-Request-Body-Size-Limit', '15mb');
    response.headers.set('X-Response-Size-Limit', '15mb');
    response.headers.set('X-Kong-Client-Body-Buffer-Size', '15mb');
    response.headers.set('X-Kong-Client-Max-Body-Size', '15mb');
    
    return response;
  }

  // Проверяем аутентификацию для защищенных маршрутов
  const session = await getSession();
  
  // Если пользователь не авторизован и пытается получить доступ к защищенным маршрутам
  if (!session.isLoggedIn && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 