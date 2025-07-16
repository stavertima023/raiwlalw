import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  try {
    const envCheck = {
      hasSessionSecret: !!process.env.SESSION_SECRET,
      hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasSupabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasSupabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      nodeEnv: process.env.NODE_ENV,
    };

    let sessionInfo = null;
    try {
      const session = await getSession();
      sessionInfo = {
        isLoggedIn: session.isLoggedIn,
        hasUser: !!session.user,
        userRole: session.user?.role || null,
        userName: session.user?.name || null,
      };
    } catch (sessionError) {
      sessionInfo = { error: (sessionError as Error).message };
    }

    return NextResponse.json({
      environment: envCheck,
      session: sessionInfo,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      error: (error as Error).message,
      stack: (error as Error).stack,
    }, { status: 500 });
  }
} 