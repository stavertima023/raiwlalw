'use client';

import * as React from 'react';
import { User } from '@/lib/types';

type SessionContextType = Omit<User, 'password_hash'> | null;

const SessionContext = React.createContext<SessionContextType>(null);

export function useSession() {
  const context = React.useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}

type SessionProviderProps = {
  children: React.ReactNode;
  user: Omit<User, 'password_hash'> | null;
};

export function SessionProvider({ children, user }: SessionProviderProps) {
  return (
    <SessionContext.Provider value={user}>
      {children}
    </SessionContext.Provider>
  );
} 