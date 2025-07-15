import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session';
 
export async function middleware(request: NextRequest) {
  const session = await getSession();
  const { isLoggedIn } = session;

  const { pathname } = request.nextUrl

  if (isLoggedIn && pathname.startsWith('/login')) {
     return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isLoggedIn && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
 
  return NextResponse.next();
}
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
} 