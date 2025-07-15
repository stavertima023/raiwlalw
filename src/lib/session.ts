import { getIronSession } from 'iron-session';
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
  // @ts-ignore - TODO: remove when iron-session has better Next.js App Router support
  return getIronSession<SessionData>(cookies(), sessionOptions);
} 