import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';
import { User } from './types';

const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error('SESSION_SECRET environment variable is required');
}

export const sessionOptions = {
  password: sessionSecret,
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
  try {
    // @ts-ignore - TODO: remove when iron-session has better Next.js App Router support
    return getIronSession<SessionData>(cookies(), sessionOptions);
  } catch (error) {
    console.error('Error getting session:', error);
    throw error;
  }
} 