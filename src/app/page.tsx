import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardRoot from './DashboardRoot';
import { SessionProvider } from '@/components/auth/SessionProvider';

export default async function Page() {
  const session = await getSession();

  if (!session.isLoggedIn || !session.user) {
    redirect('/login');
  }

  return (
    <SessionProvider user={session.user}>
      <DashboardRoot />
    </SessionProvider>
  );
} 