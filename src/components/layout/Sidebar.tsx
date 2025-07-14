'use client';

import { cn } from '@/lib/utils';
import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  PanelLeft,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { SidebarProvider } from '../ui/sidebar';


interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Sidebar({ className, children }: SidebarProps) {
  return (
    <>
        <div className={cn("hidden lg:flex", className)}>
            {children}
        </div>
    </>
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'flex h-16 items-center border-b px-6',
        'group-data-[collapsed=true]:h-auto group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-2',
        className
      )}
      {...props}
    />
  );
}

export function SidebarBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex-1', className)} {...props} />;
}

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'sticky bottom-0 mt-auto border-t p-6',
        'group-data-[collapsed=true]:p-2',
        className
      )}
      {...props}
    />
  );
}

export const SidebarMenu = React.forwardRef<
  HTMLUListElement,
  React.HTMLAttributes<HTMLUListElement>
>(({ className, ...props }, ref) => {
  return (
    <ul
      ref={ref}
      className={cn('flex flex-col gap-y-2', className)}
      {...props}
    />
  );
});
SidebarMenu.displayName = 'SidebarMenu';

export const SidebarMenuItem = React.forwardRef<
  HTMLLIElement,
  React.HTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => {
  return (
    <li
      ref={ref}
      className={cn(
        'group-data-[collapsed=true]:px-2',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuItem.displayName = 'SidebarMenuItem';

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  return (
    <Button
      ref={ref}
      className={cn(
        'w-full justify-start gap-3 rounded-lg',
        'group-data-[collapsed=true]:justify-center group-data-[collapsed=true]:px-0 group-data-[collapsed=true]:py-6',
        className
      )}
      {...props}
    />
  );
});
SidebarMenuButton.displayName = 'SidebarMenuButton';
