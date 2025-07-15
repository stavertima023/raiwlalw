import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  return NextResponse.json(user);
} 