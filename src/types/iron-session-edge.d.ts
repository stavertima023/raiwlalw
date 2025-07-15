declare module 'iron-session/edge' {
  import { IronSessionOptions } from 'iron-session';
  import { NextRequest } from 'next/server';
  import { SessionData } from '@/lib/session';

  export function getIronSession<T = SessionData>(
    req: NextRequest,
    options: IronSessionOptions
  ): Promise<T & { save: () => Promise<void>; destroy: () => Promise<void> }>;
} 