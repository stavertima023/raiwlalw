import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check for session cookie to determine if user is logged in
  const sessionCookie = request.cookies.get('webapp-tg-session');
  const isLoggedIn = !!sessionCookie;

  // Если пользователь залогинен и пытается зайти на страницу логина, редиректим на главную
  if (isLoggedIn && pathname.startsWith('/login')) {
     return NextResponse.redirect(new URL('/', request.url))
  }

  // Если пользователь не залогинен и пытается зайти на любую страницу, кроме логина, редиректим на логин
  if (!isLoggedIn && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
} 