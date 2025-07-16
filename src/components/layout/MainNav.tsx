'use client';

import { cn } from '@/lib/utils';
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';

export type NavItem = {
  id: string;
  label: string;
  href?: string;
  icon?: React.ReactNode;
};

type MainNavProps = {
  items: NavItem[];
  activeItem: string;
  onItemSelect: (id: string) => void;
};

export function MainNav({ items, activeItem, onItemSelect }: MainNavProps) {
  return (
    <SidebarMenu>
      {items.map((item) => (
        <SidebarMenuItem key={item.id}>
          <SidebarMenuButton
            isActive={activeItem === item.id}
            onClick={() => onItemSelect(item.id)}
            className="w-full justify-start gap-2"
          >
            {item.icon}
            <span>{item.label}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
