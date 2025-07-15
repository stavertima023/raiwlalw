declare module 'iron-session/edge' {
  import type { IronSession, IronSessionOptions } from 'iron-session';
  import type { NextRequest, NextResponse } from 'next/server';

  // Define the function signature for getIronSession from 'iron-session/edge'
  export function getIronSession<T>(
    req: NextRequest,
    res: NextResponse,
    options: IronSessionOptions
  ): Promise<IronSession<T>>;
} 