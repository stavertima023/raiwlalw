declare module 'iron-session/next' {
  import type { IronSession, IronSessionOptions } from 'iron-session';
  import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies';
  import type { cookies } from 'next/headers';

  // Define the function signature for getIronSession from 'iron-session/next'
  export function getIronSession<T>(
    cookies: ReadonlyRequestCookies | ReturnType<typeof cookies>,
    options: IronSessionOptions
  ): Promise<IronSession<T>>;
} 