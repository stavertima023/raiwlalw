import { NextRequest, NextResponse } from 'next/server';

export const maxDuration = 120;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Admin API: Test endpoint');
    return NextResponse.json({ message: 'Admin API test endpoint' });
  } catch (error: any) {
    console.error('❌ Admin API: Error:', error);
    return NextResponse.json({ 
      message: 'Test error', 
      error: error.message
    }, { status: 500 });
  }
} 