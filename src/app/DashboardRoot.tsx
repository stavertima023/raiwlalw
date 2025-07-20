'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from '@/lib/session';
import { OrderForm } from '@/components/dashboard/OrderForm';
import { OrderTable } from '@/components/dashboard/OrderTable';
import { Analytics } from '@/components/admin/Analytics';
import { AddExpenseForm } from '@/components/admin/AddExpenseForm';
import { SimpleDebtsSection } from '@/components/admin/SimpleDebtsSection';
import useSWR, { mutate } from 'swr';

// Функция для получения данных с пагинацией
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Network response was not ok');
  }
  return response.json();
};

export default function DashboardRoot() {
  const { user, isLoggedIn } = useSession();
  const [activeTab, setActiveTab] = useState('orders');
  const [ordersPage, setOrdersPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const [hasMoreOrders, setHasMoreOrders] = useState(true);
  const [hasMoreExpenses, setHasMoreExpenses] = useState(true);

  // Мемоизированные ключи для SWR
  const ordersKey = useMemo(() => 
    `/api/orders?page=${ordersPage}&limit=50`, [ordersPage]
  );
  const expensesKey = useMemo(() => 
    `/api/expenses?page=${expensesPage}&limit=50`, [expensesPage]
  );
  const debtsKey = useMemo(() => '/api/debts', []);

  // Запросы данных с пагинацией
  const { data: ordersData, error: ordersError, mutate: mutateOrders } = useSWR(
    activeTab === 'orders' ? ordersKey : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000
    }
  );

  const { data: expensesData, error: expensesError, mutate: mutateExpenses } = useSWR(
    activeTab === 'expenses' ? expensesKey : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 5000
    }
  );

  const { data: debtsData, error: debtsError, mutate: mutateDebts } = useSWR(
    activeTab === 'expenses' ? debtsKey : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 10000
    }
  );

  // Обновляем состояние пагинации
  useEffect(() => {
    if (ordersData) {
      setHasMoreOrders(ordersData.hasMore);
    }
  }, [ordersData]);

  useEffect(() => {
    if (expensesData) {
      setHasMoreExpenses(expensesData.hasMore);
    }
  }, [expensesData]);

  // Функции для загрузки следующей страницы
  const loadMoreOrders = useCallback(() => {
    if (hasMoreOrders) {
      setOrdersPage(prev => prev + 1);
    }
  }, [hasMoreOrders]);

  const loadMoreExpenses = useCallback(() => {
    if (hasMoreExpenses) {
      setExpensesPage(prev => prev + 1);
    }
  }, [hasMoreExpenses]);

  // Функции для обновления данных
  const refreshOrders = useCallback(() => {
    setOrdersPage(1);
    mutateOrders();
  }, [mutateOrders]);

  const refreshExpenses = useCallback(() => {
    setExpensesPage(1);
    mutateExpenses();
  }, [mutateExpenses]);

  const refreshDebts = useCallback(() => {
    mutateDebts();
  }, [mutateDebts]);

  // Обработчики успешного добавления
  const handleOrderAdded = useCallback(() => {
    refreshOrders();
  }, [refreshOrders]);

  const handleExpenseAdded = useCallback(() => {
    refreshExpenses();
    refreshDebts();
  }, [refreshExpenses, refreshDebts]);

  const handleDebtPaid = useCallback(() => {
    refreshDebts();
  }, [refreshDebts]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Доступ запрещен
          </h1>
          <p className="text-gray-600">
            Пожалуйста, войдите в систему для доступа к панели управления.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Заголовок */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Панель управления
              </h1>
              <p className="text-sm text-gray-600">
                Добро пожаловать, {user?.username || 'Пользователь'}
              </p>
            </div>
            <div className="text-sm text-gray-500">
              Роль: {user?.role || 'Неизвестно'}
            </div>
          </div>
        </div>
      </div>

      {/* Навигация */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('orders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'orders'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Заказы
            </button>
            <button
              onClick={() => setActiveTab('expenses')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'expenses'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Расходы
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'analytics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Аналитика
            </button>
          </nav>
        </div>

        {/* Контент */}
        <div className="space-y-6">
          {/* Вкладка Заказы */}
          {activeTab === 'orders' && (
            <div className="space-y-6">
              <OrderForm onOrderAdded={handleOrderAdded} />
              
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Список заказов
                  </h2>
                </div>
                <OrderTable 
                  orders={ordersData?.orders || []}
                  error={ordersError}
                  onRefresh={refreshOrders}
                  hasMore={hasMoreOrders}
                  onLoadMore={loadMoreOrders}
                />
              </div>
            </div>
          )}

          {/* Вкладка Расходы */}
          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
              
              <div className="bg-white shadow rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-medium text-gray-900">
                    Список расходов
                  </h2>
                </div>
                <div className="p-6">
                  {expensesError ? (
                    <div className="text-red-600">
                      Ошибка загрузки расходов: {expensesError.message}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {expensesData?.expenses?.map((expense: any) => (
                        <div key={expense.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{expense.category}</h3>
                              <p className="text-sm text-gray-600">{expense.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(expense.date).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium">{expense.amount} ₽</p>
                              <p className="text-sm text-gray-500">{expense.responsible}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      {hasMoreExpenses && (
                        <button
                          onClick={loadMoreExpenses}
                          className="w-full py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          Загрузить еще
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Секция долгов */}
              <SimpleDebtsSection 
                debts={debtsData || []}
                error={debtsError}
                onDebtPaid={handleDebtPaid}
              />
            </div>
          )}

          {/* Вкладка Аналитика */}
          {activeTab === 'analytics' && (
            <Analytics 
              orders={ordersData?.orders || []}
              expenses={expensesData?.expenses || []}
              debts={debtsData || []}
            />
          )}
        </div>
      </div>
    </div>
  );
}
