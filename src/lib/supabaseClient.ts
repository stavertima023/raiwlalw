import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://kong-production-efec.up.railway.app';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxenl2bnN5anJmanljemJsYWh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyNDE3OTIsImV4cCI6MjA2NzgxNzc5Mn0.2f1JGzeG2125XWE9McYbSXpI-_gDX_yVEO2BnzldITI';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxenl2bnN5anJmanljemJsYWh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjI0MTc5MiwiZXhwIjoyMDY3ODE3NzkyfQ.Tx2TojfWfkussv0sGRIQ8cvIPxUkTDm_FhUeFMkrSpI';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Client for frontend (with anon key, respects RLS)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Client for backend/API routes (with service key, bypasses RLS)
if (!supabaseServiceKey) {
  console.warn('SUPABASE_SERVICE_ROLE_KEY not found. Admin operations will not work.');
}

export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null; 