'use client';

import * as React from 'react';
import { Sidebar, SidebarBody, SidebarHeader, SidebarTrigger, SidebarInset, SidebarProvider, SidebarRail } from '@/components/ui/sidebar';
import { MainNav, type NavItem } from './MainNav';
import { UserNav } from './UserNav';
import { ThemeToggle } from './ThemeToggle';
import type { User, Role } from '@/lib/types';
import { Home, Package, BarChart3, BotMessageSquare, Settings, LifeBuoy, SquareUser, Truck, Factory, Users } from 'lucide-react';
import { mockUsers } from '@/lib/data';

interface AppLayoutProps {
  children: (activeView: string) => React.ReactNode;
  currentUser: User;
  onUserChange: (user: User) => void;
}

const navConfig: Record<Role, { top: NavItem[], bottom: NavItem[] }> = {
  'Продавец': {
    top: [
      { id: 'seller-dashboard', title: 'Дашборд', icon: Home, href: '#' },
    ],
    bottom: [],
  },
  'Принтовщик': {
    top: [
      { id: 'printer-orders', title: 'Заказы', icon: Package, href: '#' },
    ],
    bottom: [],
  },
  'Администратор': {
    top: [
      { id: 'admin-orders', title: 'Список заказов', icon: Truck, href: '#' },
      { id: 'admin-expenses', title: 'Расходы', icon: Factory, href: '#' },
      { id: 'admin-analytics', title: 'Аналитика', icon: BarChart3, href: '#' },
      { id: 'admin-ai-analytics', title: 'AI-аналитика', icon: BotMessageSquare, href: '#' },
    ],
    bottom: [],
  },
};

export function AppLayout({ children, currentUser, onUserChange }: AppLayoutProps) {
  const [activeView, setActiveView] = React.useState<string>(navConfig[currentUser.role].top[0]?.id || 'default');

  React.useEffect(() => {
    // Reset active view when user role changes
    const newActiveView = navConfig[currentUser.role].top[0]?.id || 'default';
    setActiveView(newActiveView);
  }, [currentUser.role]);

  const handleNavClick = (id: string) => {
    setActiveView(id);
  };

  const navItems = navConfig[currentUser.role];

  return (
    <SidebarProvider defaultOpen>
      <Sidebar>
        <SidebarHeader>
           <div className="flex items-center gap-2">
                 <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    className="h-7 w-7 text-primary"
                    >
                    <rect width="256" height="256" fill="none" />
                    <line
                        x1="208"
                        y1="128"
                        x2="128"
                        y2="208"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="16"
                    />
                    <line
                        x1="192"
                        y1="40"
                        x2="40"
                        y2="192"
                        fill="none"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="16"
                    />
                    </svg>
                <h1 className="text-xl font-bold">OrderFlow</h1>
            </div>
        </SidebarHeader>
        <SidebarBody>
           <MainNav 
            topItems={navItems.top} 
            bottomItems={navItems.bottom} 
            activeItem={activeView} 
            onItemClick={handleNavClick}
          />
        </SidebarBody>
         <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="flex items-center justify-between p-4 border-b h-16">
          <SidebarTrigger />
          <div className="flex-1"></div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <UserNav allUsers={mockUsers} currentUser={currentUser} onUserChange={onUserChange} />
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children(activeView)}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}