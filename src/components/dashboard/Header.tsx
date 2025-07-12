'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ArrowLeft } from 'lucide-react';
import { OrderForm } from './OrderForm';
import type { Order, User } from '@/lib/types';

interface HeaderProps {
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate'>) => void;
  onBackToDashboard: () => void;
  showBackButton: boolean;
  currentUser: User;
}

const Header: React.FC<HeaderProps> = ({ onAddOrder, onBackToDashboard, showBackButton, currentUser }) => {
  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            {showBackButton && (
              <Button variant="ghost" size="icon" onClick={onBackToDashboard} className="mr-2">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary h-6 w-6"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <h1 className="text-xl font-bold text-foreground">OrderFlow Factory</h1>
          </div>
          <OrderForm onSave={onAddOrder} currentUserRole={currentUser.role}>
            <Button disabled={currentUser.role !== 'Продавец'}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Добавить заказ
            </Button>
          </OrderForm>
        </div>
      </div>
    </header>
  );
};

export default Header;
