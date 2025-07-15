'use client';

import * as React from 'react';
import { Sidebar, SidebarBody, SidebarHeader, SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { MainNav, type NavItem } from './MainNav';
import { UserNav } from './UserNav';
import { ThemeToggle } from './ThemeToggle';
import { User } from '@/lib/types';

type AppLayoutProps = {
  children: (activeView: string) => React.ReactNode;
  currentUser: Omit<User, 'password_hash'>;
};

export function AppLayout({ children, currentUser }: AppLayoutProps) {
  // Guard Clause: If currentUser is not available, do not render.
  // This prevents client-side crashes during navigation.
  if (!currentUser) {
    return null;
  }

  const [activeView, setActiveView] = React.useState('');

  const getNavItems = (role: User['role']): NavItem[] => {
    switch (role) {
      case 'Администратор':
        return [
          { id: 'admin-orders', label: 'Заказы' },
          { id: 'admin-expenses', label: 'Расходы' },
          { id: 'admin-analytics', label: 'Аналитика' },
          { id: 'admin-ai-analytics', label: 'AI Аналитика' },
        ];
      case 'Принтовщик':
        return [{ id: 'printer-dashboard', label: 'Панель принтовщика' }];
      case 'Продавец':
      default:
        return [{ id: 'seller-dashboard', label: 'Панель продавца' }];
    }
  };
  
  const navItems = getNavItems(currentUser.role);
  
  React.useEffect(() => {
    if (navItems.length > 0 && !activeView) {
        setActiveView(navItems[0].id);
    }
  }, [navItems, activeView]);


  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader>
             <UserNav user={currentUser} />
          </SidebarHeader>
          <SidebarBody>
             <MainNav items={navItems} activeItem={activeView} onItemSelect={setActiveView} />
          </SidebarBody>
          <SidebarInset className='p-4'>
            <ThemeToggle />
          </SidebarInset>
        </Sidebar>
        
        <div className="flex-1">
           <main className="p-4 md:p-8">
              {children(activeView)}
           </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
