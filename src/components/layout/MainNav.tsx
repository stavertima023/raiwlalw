'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

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
    <nav className="grid items-start gap-2">
      {items.map((item) => (
        <Button
          key={item.id}
          variant={activeItem === item.id ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={() => onItemSelect(item.id)}
        >
          {item.icon && <span className="mr-2 h-4 w-4">{item.icon}</span>}
          {item.label}
        </Button>
      ))}
    </nav>
  );
}
