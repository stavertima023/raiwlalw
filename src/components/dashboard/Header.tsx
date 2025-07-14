'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { OrderForm } from './OrderForm';
import type { Order, User } from '@/lib/types';
import { ThemeToggle } from '../layout/ThemeToggle';
import { UserNav } from '../layout/UserNav';
import { mockUsers } from '@/lib/data';

interface HeaderProps {
  currentUser: User;
  onUserChange: (user: User) => void;
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onUserChange, onAddOrder }) => {
  return (
    <header className="bg-background border-b sticky top-0 z-10">
      <div className="flex items-center justify-between h-16 px-4 md:px-8">
        <div className="flex items-center gap-2">
           <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 256 256"
              className="h-6 w-6"
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
            <h1 className="text-xl font-bold text-foreground">OrderFlow</h1>
        </div>
        <div className="flex items-center gap-4">
          {currentUser.role === 'Продавец' && (
            <div className="hidden md:block">
              <OrderForm onSave={onAddOrder} currentUser={currentUser}>
                <Button>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Добавить заказ
                </Button>
              </OrderForm>
            </div>
          )}
          <ThemeToggle />
          <UserNav allUsers={mockUsers} currentUser={currentUser} onUserChange={onUserChange} />
        </div>
      </div>
    </header>
  );
};
