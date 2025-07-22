import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardRoot from './DashboardRoot';

export default async function Home() {
  const session = await getSession();
  const { user, isLoggedIn } = session;

  if (!isLoggedIn || !user) {
    redirect('/login');
  }

  return <DashboardRoot initialUser={user || null} />;
} 