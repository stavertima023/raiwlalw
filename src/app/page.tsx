import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardRoot from './DashboardRoot';

export default async function Home() {
  try {
    const session = await getSession();
    const { user, isLoggedIn } = session;

    if (!isLoggedIn || !user) {
      redirect('/login');
    }

    return <DashboardRoot initialUser={user || null} />;
  } catch (error) {
    console.error('Error in Home page:', error);
    
    // Если есть проблемы с сессией, перенаправляем на страницу входа
    redirect('/login');
  }
} 