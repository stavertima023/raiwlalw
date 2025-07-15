import { getIronSession } from 'iron-session';
import { getIronSession as getIronSessionEdge } from 'iron-session/edge';
import type { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { User } from './types';

export const sessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: 'webapp-tg-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
  },
};

// This is the user type that will be stored in the session
export type SessionData = {
  user?: Omit<User, 'password_hash'>;
  isLoggedIn: boolean;
}

export const getSession = () => {
  // Type cast due to mismatch between Next.js cookies store and iron-session types
  // TODO: Remove cast when iron-session updates typings for Next.js cookies()
  return getIronSession<SessionData>(cookies() as any, sessionOptions);
}

// Helper for Next.js Middleware (edge runtime)
export const getSessionFromRequest = (req: NextRequest) => {
  // iron-session edge version works directly with the request object
  return getIronSessionEdge<SessionData>(req, sessionOptions);
}; 