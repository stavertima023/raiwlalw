'use client';

import * as React from 'react';
import { Sidebar, SidebarBody, SidebarHeader, SidebarTrigger, SidebarInset, SidebarProvider, SidebarRail } from '@/components/ui/sidebar';
import { MainNav, type NavItem } from './MainNav';
import { UserNav } from './UserNav';
import { ThemeToggle } from './ThemeToggle';
import type { User, Role } from '@/lib/types';
import { Home, Package, BarChart3, BotMessageSquare, Truck, Factory } from 'lucide-react';
import { mockUsers } from '@/lib/data';
import { Header } from '@/components/dashboard/Header';
import { Dashboard } from '../dashboard/Dashboard';
import { OrderTable } from '../dashboard/OrderTable';
import { AdminOrderList } from '../admin/AdminOrderList';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Order, OrderStatus } from '@/lib/types';

interface AppLayoutProps {
  children: (activeView: string) => React.ReactNode;
  currentUser: User;
  onUserChange: (user: User) => void;
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
  onUpdateStatus: (orderId: string, newStatus: OrderStatus) => void;
  orders: Order[];
}

const navConfig: Record<Role, { top: NavItem[], bottom: NavItem[] }> = {
  'Продавец': {
    top: [],
    bottom: [],
  },
  'Принтовщик': {
    top: [],
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

export function AppLayout({ children, currentUser, onUserChange, onAddOrder, onUpdateStatus, orders }: AppLayoutProps) {
  const [activeView, setActiveView] = React.useState<string>('default');

  React.useEffect(() => {
    if (currentUser.role === 'Администратор') {
      setActiveView(navConfig[currentUser.role].top[0]?.id || 'default');
    } else {
        setActiveView('default');
    }
  }, [currentUser.role]);

  const handleNavClick = (id: string) => {
    setActiveView(id);
  };

  if (currentUser.role !== 'Администратор') {
     return (
      <div className="flex flex-col min-h-screen">
        <Header 
          currentUser={currentUser}
          onUserChange={onUserChange}
          onAddOrder={onAddOrder}
        />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto bg-muted/40">
           {children(activeView)}
        </main>
      </div>
    );
  }

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
