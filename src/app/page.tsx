import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';
import DashboardRoot from './DashboardRoot';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { Order } from '@/lib/types';

export default async function Home() {
  const session = await getSession();
  const { user, isLoggedIn } = session;

  if (!isLoggedIn || !user) {
    redirect('/login');
  }

  // Серверный prefetch заказов для ускорения первой загрузки
  let initialOrders: Order[] = [];
  
  try {
    if (supabaseAdmin) {
      let query = supabaseAdmin
        .from('orders')
        .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment, ready_at')
        .order('orderDate', { ascending: false });

      // Если пользователь продавец, фильтруем только его заказы
      if (user.role === 'Продавец') {
        query = query.eq('seller', user.username);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        // Парсим даты для корректной работы на клиенте
        initialOrders = data.map(item => ({
          ...item, 
          orderDate: new Date(item.orderDate),
          ready_at: item.ready_at ? new Date(item.ready_at) : undefined
        }));
      }
    }
  } catch (error) {
    console.error('Ошибка prefetch заказов:', error);
    // Не прерываем загрузку страницы, если prefetch не удался
  }

  return <DashboardRoot initialUser={user || null} initialOrders={initialOrders} />;
} 