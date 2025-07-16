import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session/edge';
import { sessionOptions, type SessionData } from '@/lib/session';
 
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Temporarily skip middleware for all routes to diagnose the issue
  console.log(`Middleware: Processing route: ${pathname}`);
  
  // Skip middleware entirely for debugging
  if (pathname.startsWith('/api/') || pathname.startsWith('/login') || pathname === '/') {
    console.log(`Middleware: Allowing route without session check: ${pathname}`);
    return NextResponse.next();
  }
  
  try {
    const response = NextResponse.next();
    const session = await getIronSession<SessionData>(request, response, sessionOptions);

    const { user, isLoggedIn } = session;

    console.log(`Middleware: Route ${pathname}, isLoggedIn: ${isLoggedIn}`);

    // Если пользователь залогинен и пытается зайти на страницу логина, редиректим на главную
    if (isLoggedIn && pathname.startsWith('/login')) {
       return NextResponse.redirect(new URL('/', request.url))
    }

    // Если пользователь не залогинен и пытается зайти на любую страницу, кроме логина, редиректим на логин
    if (!isLoggedIn && !pathname.startsWith('/login')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
 
    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    // In case of middleware error, allow the request to continue
    return NextResponse.next();
  }
}
 
export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\.png$).*)'],
} 