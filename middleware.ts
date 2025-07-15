import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getIronSession } from 'iron-session/edge';
import { sessionOptions, type SessionData } from '@/lib/session';
 
export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  // Use the edge-compatible getIronSession
  const session = await getIronSession<SessionData>(request, response, sessionOptions);

  const { isLoggedIn } = session;
  const { pathname } = request.nextUrl

  if (isLoggedIn && pathname.startsWith('/login')) {
     return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isLoggedIn && !pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
 
  // IMPORTANT: Return the response to save the session cookie
  return response;
}
 
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
} 