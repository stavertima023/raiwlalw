import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';
import { User } from './types';

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'webapp-tg-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

export type SessionData = {
  user?: Omit<User, 'password_hash'>;
  isLoggedIn: boolean;
}

// This function is for Server Components and API Routes.
export function getSession(): Promise<IronSession<SessionData>> {
  // The type assertion is needed due to a mismatch between Next.js's
  // ReadonlyRequestCookies and iron-session's CookieStore type.
  return getIronSession<SessionData>(cookies() as any, sessionOptions);
} 