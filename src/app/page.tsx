import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardRoot from './DashboardRoot';
import { User } from '@/lib/types';

export default async function Page() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    redirect('/login');
  }

  // We are sure user exists here, so we cast it.
  const user = session.user as Omit<User, 'password_hash'>;

  return <DashboardRoot initialUser={user} />;
} 