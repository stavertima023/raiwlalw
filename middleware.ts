import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session/edge';
import { sessionOptions, type SessionData } from '@/lib/session';
 
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const { user, isLoggedIn } = session;

  const { pathname } = request.nextUrl

  // Если пользователь залогинен и пытается зайти на страницу логина, редиректим на главную
  if (isLoggedIn && pathname.startsWith('/login')) {
     return NextResponse.redirect(new URL('/', request.url))
  }

  // Если пользователь не залогинен и пытается зайти на любую страницу, кроме логина, редиректим на логин
  if (!isLoggedIn && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
 
  return response;
}
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
} 