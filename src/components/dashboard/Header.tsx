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
              fill="currentColor"
              className="text-primary h-7 w-7"
            >
              <path d="M16.42.06a4.05 4.05 0 0 0-4.05 4.05v1.35c-2.22 0-4.03 1.81-4.03 4.03v.28a4.05 4.05 0 1 0 8.09 0v-.28c0-2.22-1.81-4.03-4.03-4.03h-.03V4.11a4.05 4.05 0 0 0 4.05-4.05zm-4.05 15.54a4.05 4.05 0 0 0-4.05-4.05H8.04c-2.24 0-4.05 1.81-4.05 4.05v5.33A4.05 4.05 0 0 0 8.04 24h.28a4.05 4.05 0 0 0 4.05-4.05v-4.35z"></path>
            </svg>
            <h1 className="text-xl font-bold text-foreground">Avito</h1>
          </div>
          <OrderForm onSave={onAddOrder} currentUser={currentUser}>
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
