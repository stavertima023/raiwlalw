import { createClient } from '@supabase/supabase-js'

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
// Normalize accidental leading '@' in URL copied from Vercel variables
if (supabaseUrl && supabaseUrl.startsWith('@')) {
  supabaseUrl = supabaseUrl.slice(1);
}
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing required Supabase environment variables; skipping default client init at build time');
}

// Client for frontend (with anon key, respects RLS)
export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : (undefined as any);

// Client for backend/API routes (with service key, bypasses RLS)
if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Admin operations will not work.');
}

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          'x-api-key': supabaseServiceKey,
        },
        fetch: (input: any, init?: any) => {
          try {
            const originalUrl = typeof input === 'string' ? input : input?.url;
            const url = new URL(originalUrl, supabaseUrl);
            if (url.pathname.startsWith('/storage') || url.pathname.includes('/storage/v1')) {
              url.searchParams.set('apikey', supabaseServiceKey!);
              return fetch(url.toString(), init);
            }
          } catch (_) {}
          return fetch(input as any, init);
        },
      },
    })
  : null;

// Dedicated admin client for Storage API behind Kong: some gateways expect apikey=anon
export const supabaseStorageAdmin = (supabaseServiceKey && supabaseUrl)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseAnonKey,
          'x-api-key': supabaseAnonKey,
        },
        fetch: (input: any, init?: any) => {
          try {
            const originalUrl = typeof input === 'string' ? input : input?.url;
            const url = new URL(originalUrl, supabaseUrl);
            if (url.pathname.startsWith('/storage') || url.pathname.includes('/storage/v1')) {
              url.searchParams.set('apikey', supabaseAnonKey!);
              return fetch(url.toString(), init);
            }
          } catch (_) {}
          return fetch(input as any, init);
        },
      },
    })
  : null;

export const supabaseStorageAdminServiceApikey = (supabaseServiceKey && supabaseUrl)
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${supabaseServiceKey}`,
          apikey: supabaseServiceKey,
          'x-api-key': supabaseServiceKey,
        },
        fetch: (input: any, init?: any) => {
          try {
            const originalUrl = typeof input === 'string' ? input : input?.url;
            const url = new URL(originalUrl, supabaseUrl);
            if (url.pathname.startsWith('/storage') || url.pathname.includes('/storage/v1')) {
              url.searchParams.set('apikey', supabaseServiceKey!);
              return fetch(url.toString(), init);
            }
          } catch (_) {}
          return fetch(input as any, init);
        },
      },
    })
  : null;

// Separate Supabase client for Photo Storage (different Supabase project/account)
let photoSupabaseUrl = process.env.PHOTO_SUPABASE_URL || process.env.SUPABASE_URL;
if (photoSupabaseUrl && photoSupabaseUrl.startsWith('@')) {
  photoSupabaseUrl = photoSupabaseUrl.slice(1);
}
const photoSupabaseServiceKey = process.env.PHOTO_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE;

export const photoSupabaseStorageAdmin = (photoSupabaseServiceKey && photoSupabaseUrl)
  ? createClient(photoSupabaseUrl, photoSupabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  : null;