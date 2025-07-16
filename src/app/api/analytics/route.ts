import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabaseClient';
import { getSession } from '@/lib/session';
import { AnalyticsData, AnalyticsFilters, OrderStatus, ExpenseCategory } from '@/lib/types';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session.isLoggedIn || !session.user || session.user.role !== 'Администратор') {
      return Response.json(
        { error: 'Доступ запрещен' },
        { status: 403 }
      );
    }

    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const sellersParam = searchParams.get('sellers');
    const sellers = sellersParam ? sellersParam.split(',') : undefined;

    const filters: AnalyticsFilters = {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      sellers
    };



    // Fetch orders with filters
    let ordersQuery = supabase.from('orders').select('*');

    if (filters.dateFrom) {
      ordersQuery = ordersQuery.gte('orderDate', filters.dateFrom);
    }

    if (filters.dateTo) {
      ordersQuery = ordersQuery.lte('orderDate', filters.dateTo + 'T23:59:59.999Z');
    }

    if (filters.sellers && filters.sellers.length > 0) {
      ordersQuery = ordersQuery.in('seller', filters.sellers);
    }

    const { data: orders, error: ordersError } = await ordersQuery.order('orderDate', { ascending: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return Response.json(
        { error: 'Ошибка получения заказов' },
        { status: 500 }
      );
    }

    // Fetch payouts with date filters
    let payoutsQuery = supabase.from('payouts').select('*');

    if (filters.dateFrom) {
      payoutsQuery = payoutsQuery.gte('date', filters.dateFrom);
    }

    if (filters.dateTo) {
      payoutsQuery = payoutsQuery.lte('date', filters.dateTo + 'T23:59:59.999Z');
    }

    if (filters.sellers && filters.sellers.length > 0) {
      payoutsQuery = payoutsQuery.in('seller', filters.sellers);
    }

    const { data: payouts, error: payoutsError } = await payoutsQuery;

    if (payoutsError) {
      console.error('Error fetching payouts:', payoutsError);
      return Response.json(
        { error: 'Ошибка получения выводов' },
        { status: 500 }
      );
    }

    // Fetch expenses with date filters
    let expensesQuery = supabase.from('expenses').select('*');

    if (filters.dateFrom) {
      expensesQuery = expensesQuery.gte('date', filters.dateFrom);
    }

    if (filters.dateTo) {
      expensesQuery = expensesQuery.lte('date', filters.dateTo + 'T23:59:59.999Z');
    }

    const { data: expenses, error: expensesError } = await expensesQuery;

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      return Response.json(
        { error: 'Ошибка получения расходов' },
        { status: 500 }
      );
    }

    // Calculate analytics
    const analytics: AnalyticsData = {
      totalOrders: orders?.length || 0,
      ordersByStatus: {
        'Добавлен': 0,
        'Готов': 0,
        'Отправлен': 0,
        'Исполнен': 0,
        'Отменен': 0,
        'Возврат': 0,
      },
      totalPayouts: 0,
      averageOrderPrice: 0,
      expensesByCategory: {
        'Аренда': 0,
        'Зарплата': 0,
        'Расходники': 0,
        'Маркетинг': 0,
        'Налоги': 0,
        'Ткань': 0,
        'Курьер': 0,
        'Расходники швейки': 0,
        'Другое': 0,
      }
    };

    // Count orders by status
    if (orders) {
      orders.forEach((order: any) => {
        const status = order.status as OrderStatus;
        if (analytics.ordersByStatus.hasOwnProperty(status)) {
          analytics.ordersByStatus[status]++;
        }
      });

      // Calculate average order price
      const totalPrice = orders.reduce((sum: number, order: any) => sum + (order.price || 0), 0);
      analytics.averageOrderPrice = orders.length > 0 ? totalPrice / orders.length : 0;
    }

    // Calculate total payouts
    if (payouts) {
      analytics.totalPayouts = payouts.reduce((sum: number, payout: any) => sum + (payout.amount || 0), 0);
    }

    // Calculate expenses by category
    if (expenses) {
      expenses.forEach((expense: any) => {
        const category = expense.category as ExpenseCategory;
        if (analytics.expensesByCategory.hasOwnProperty(category)) {
          analytics.expensesByCategory[category] += expense.amount || 0;
        }
      });
    }

    return Response.json(analytics);

  } catch (error) {
    console.error('Analytics API error:', error);
    return Response.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
} 