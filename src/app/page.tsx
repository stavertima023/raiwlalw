import { getSession, type SessionData } from "@/lib/session";
import { redirect } from 'next/navigation';
import DashboardRoot from './DashboardRoot';

export default async function Home() {
  const session = await getSession();
  const { user } = session as SessionData;

  if (!user) {
    // This should not happen due to middleware, but as a fallback
    redirect('/login');
  }

  return <DashboardRoot initialUser={user} />;
} 