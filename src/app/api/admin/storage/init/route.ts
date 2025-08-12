import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { ensureBucketPublic } from '@/lib/storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== 'Администратор') {
    return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }
  try {
    await ensureBucketPublic('order-photos');
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}

export async function GET() {
  const session = await getSession();
  if (!session.isLoggedIn || session.user?.role !== 'Администратор') {
    return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }
  try {
    await ensureBucketPublic('order-photos');
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || String(e) }, { status: 500 });
  }
}

