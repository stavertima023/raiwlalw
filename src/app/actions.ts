'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const LoginSchema = z.object({
  username: z.string().min(1, { message: 'Логин не может быть пустым' }),
  password: z.string().min(1, { message: 'Пароль не может быть пустым' }),
});

export type FormState = {
  message: string;
};

export async function login(prevState: FormState, formData: FormData) {
  const parsed = LoginSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    return { message: parsed.error.errors.map((e) => e.message).join(', ') };
  }
  
  const { username, password } = parsed.data;

  // 1. Find user in database
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) {
    return { message: 'Неверный логин или пароль' };
  }

  // 2. Compare password hash
  const passwordsMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordsMatch) {
    return { message: 'Неверный логин или пароль' };
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

  // 4. Redirect to dashboard
  return redirect('/');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
} 