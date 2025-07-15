import { getIronSession } from 'iron-session/next';
import { cookies } from 'next/headers';
import { User } from './types';

export const sessionOptions = {
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

// This universal function works in Server Components, API Routes, and Middleware
// by leveraging the Next.js cookies() function.
export function getSession() {
  return getIronSession<SessionData>(cookies(), sessionOptions);
} 