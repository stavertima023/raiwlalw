import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json({ message: 'Логин и пароль обязательны' }, { status: 400 });
  }

  // 1. Find user in database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) {
    return NextResponse.json({ message: 'Неверный логин или пароль' }, { status: 401 });
  }

  // 2. Compare password hash
  const passwordsMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordsMatch) {
    return NextResponse.json({ message: 'Неверный логин или пароль' }, { status: 401 });
  }

  // 3. Save user data in session
  const session = await getSession();
  session.user = {
    id: user.id,
    name: user.name,
    username: user.username,
    role: user.role,
  };
  session.isLoggedIn = true;
  await session.save();

  // 4. Return user info
  const { password_hash, ...userWithoutPassword } = user;
  return NextResponse.json(userWithoutPassword);
} 