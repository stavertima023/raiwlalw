'use client';

import * as React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { mockUsers } from '@/lib/data';

interface UserNavProps {
  allUsers: User[];
  currentUser: User;
  onUserChange: (user: User) => void;
}

export function UserNav({ allUsers, currentUser, onUserChange }: UserNavProps) {
  
  const handleRoleChange = (telegramId: string) => {
    const newUser = allUsers.find(u => u.telegramId === telegramId);
    if (newUser) {
        onUserChange(newUser);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="#" alt="User avatar" />
            <AvatarFallback>{getInitials(currentUser.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{currentUser.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{currentUser.position}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={currentUser.telegramId} onValueChange={handleRoleChange}>
            <DropdownMenuLabel>Сменить роль</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allUsers.map((user) => (
                 <DropdownMenuRadioItem key={user.telegramId} value={user.telegramId}>
                    {user.role} ({user.name})
                </DropdownMenuRadioItem>
            ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
