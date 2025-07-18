import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      sessionSecret: !!process.env.SESSION_SECRET,
    };

    return NextResponse.json({
      message: 'Environment variables check',
      envCheck,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set',
    });
  } catch (error) {
    console.error('Error in env test:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 