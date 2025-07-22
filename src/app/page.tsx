import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardRootOptimized from './DashboardRootOptimized';

export default async function Home() {
  const session = await getSession();
  const { user, isLoggedIn } = session;

  if (!isLoggedIn || !user) {
    redirect('/login');
  }

  return <DashboardRootOptimized initialUser={user || null} />;
} 