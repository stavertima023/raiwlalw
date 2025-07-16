'use client';

import * as React from 'react';
import { Sidebar, SidebarBody, SidebarHeader, SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MainNav, type NavItem } from './MainNav';
import { UserNav } from './UserNav';
import { ThemeToggle } from './ThemeToggle';
import { User } from '@/lib/types';
import { 
  ShoppingCart,
  Receipt,
  Banknote,
  BarChart3,
  Brain,
  Printer,
  Store
} from 'lucide-react';

type AppLayoutProps = {
  children: (activeView: string) => React.ReactNode;
  currentUser: Omit<User, 'password_hash'> | undefined | null;
};

export function AppLayout({ children, currentUser }: AppLayoutProps) {
  // Defensive check for client-side hydration
  if (!currentUser) {
    // You can replace this with a more sophisticated loading spinner
    return <div className="flex h-screen w-full items-center justify-center">Загрузка...</div>;
}

  const [activeView, setActiveView] = React.useState('');

  const getNavItems = (role: User['role']): NavItem[] => {
    switch (role) {
      case 'Администратор':
        return [
          { id: 'admin-orders', label: 'Заказы', icon: <ShoppingCart className="h-4 w-4" /> },
          { id: 'admin-expenses', label: 'Расходы', icon: <Receipt className="h-4 w-4" /> },
          { id: 'admin-payouts', label: 'Выводы', icon: <Banknote className="h-4 w-4" /> },
          { id: 'admin-analytics', label: 'Аналитика', icon: <BarChart3 className="h-4 w-4" /> },
          { id: 'admin-ai-analytics', label: 'AI Аналитика', icon: <Brain className="h-4 w-4" /> },
        ];
      case 'Принтовщик':
        return [{ id: 'printer-dashboard', label: 'Панель принтовщика', icon: <Printer className="h-4 w-4" /> }];
      case 'Продавец':
      default:
        return [{ id: 'seller-dashboard', label: 'Панель продавца', icon: <Store className="h-4 w-4" /> }];
    }
  };
  
  const navItems = getNavItems(currentUser.role);

  React.useEffect(() => {
    if (navItems.length > 0 && !activeView) {
        setActiveView(navItems[0].id);
  }
  }, [navItems, activeView]);

  // Only show sidebar for administrators
  if (currentUser.role === 'Администратор') {
     return (
      <SidebarProvider>
        <div className="flex min-h-screen w-full">
          <Sidebar>
            <SidebarHeader className="p-4">
              <div className="flex items-center justify-between">
                <UserNav user={currentUser} />
                <SidebarTrigger className="lg:hidden" />
              </div>
            </SidebarHeader>
            <SidebarBody className="p-4">
              <MainNav items={navItems} activeItem={activeView} onItemSelect={setActiveView} />
            </SidebarBody>
          </Sidebar>
          
          <SidebarInset className="flex-1 min-w-0">
            <div className="flex items-center justify-between p-4 border-b lg:hidden">
              <h1 className="text-lg font-semibold">
                {navItems.find(item => item.id === activeView)?.label || 'Панель управления'}
              </h1>
              <div className="flex items-center gap-2">
                <SidebarTrigger />
                <ThemeToggle />
              </div>
            </div>
            <main className="p-4 md:p-8">
           {children(activeView)}
        </main>
          </SidebarInset>
      </div>
      </SidebarProvider>
    );
  }

  // Simple layout for sellers and printers without sidebar
  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <h1 className="text-lg font-semibold">
          {currentUser.role === 'Продавец' ? 'Панель продавца' : 'Панель принтовщика'}
        </h1>
           <div className="flex items-center gap-2">
          <UserNav user={currentUser} />
            <ThemeToggle />
          </div>
        </header>
      <main className="flex-1 p-4 md:p-8">
          {children(activeView)}
        </main>
    </div>
  );
}
