'use client';

import * as React from 'react';
import Link from 'next/link';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from './Sidebar';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface NavItem {
  id: string;
  title: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface MainNavProps {
  topItems: NavItem[];
  bottomItems: NavItem[];
  activeItem: string;
  onItemClick: (id: string) => void;
}

export function MainNav({ topItems, bottomItems, activeItem, onItemClick }: MainNavProps) {
  const renderNavItem = (item: NavItem) => (
    <SidebarMenuItem key={item.id}>
       <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
              <SidebarMenuButton
                onClick={() => onItemClick(item.id)}
                className="w-full"
                variant={activeItem === item.id ? 'default' : 'ghost'}
                disabled={item.disabled}
                asChild
              >
                  <Link href={item.href}>
                    <item.icon className="h-4 w-4" />
                    <span>{item.title}</span>
                  </Link>
              </SidebarMenuButton>
          </TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-4">
              {item.title}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </SidebarMenuItem>
  );

  return (
    <div className='flex flex-col justify-between h-full p-2'>
        <SidebarMenu>
            {topItems.map(renderNavItem)}
        </SidebarMenu>
        <SidebarMenu>
            {bottomItems.map(renderNavItem)}
        </SidebarMenu>
    </div>
  );
}
