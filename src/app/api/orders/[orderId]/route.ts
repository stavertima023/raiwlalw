import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderStatusEnum } from '@/lib/types';
import { z } from 'zod';

const UpdateStatusSchema = z.object({
  status: OrderStatusEnum,
});

export async function PATCH(request: Request, { params }: { params: { orderId: string } }) {
  console.log('PATCH /api/orders/[orderId] started');
  
  try {
    const session = await getSession();
    console.log('Session retrieved:', { isLoggedIn: session.isLoggedIn, userRole: session.user?.role });
    
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.log('Unauthorized: no user or not logged in');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    if (!supabaseAdmin) {
      console.log('Supabase admin client not available');
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const { orderId } = params;
    console.log('Order ID:', orderId);
    
    const json = await request.json();
    console.log('Request body:', json);
    
    const { status } = UpdateStatusSchema.parse(json);
    console.log('Parsed status:', status);

    // First, get the current order to check ownership and current status
    console.log('Fetching current order...');
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      return NextResponse.json({ message: 'Ошибка получения заказа', error: fetchError.message }, { status: 500 });
    }
    
    if (!currentOrder) {
      console.log('Order not found');
      return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
    }

    console.log('Current order:', { id: currentOrder.id, status: currentOrder.status, seller: currentOrder.seller });

    // Authorization logic based on user role
    console.log('Authorization check for user role:', user.role);
    if (user.role === 'Администратор') {
      console.log('Admin authorization: allowed');
      // Admin can change any order to any status
    } else if (user.role === 'Принтовщик') {
      console.log('Printer authorization: allowed');
      // Printer can change any order status (existing behavior)
    } else if (user.role === 'Продавец') {
      console.log('Seller authorization check');
      // Seller can only modify their own orders with specific rules
      if (currentOrder.seller !== user.username) {
        console.log('Seller authorization failed: different seller');
        return NextResponse.json({ message: 'Доступ запрещен: вы можете изменять только свои заказы' }, { status: 403 });
      }

      // Check if the status change is allowed for sellers
      if (status === 'Отменен') {
        // Can cancel orders with status "Добавлен" or "Готов"
        if (currentOrder.status !== 'Добавлен' && currentOrder.status !== 'Готов') {
          console.log('Seller cannot cancel order with status:', currentOrder.status);
          return NextResponse.json({ 
            message: `Нельзя отменить заказ со статусом "${currentOrder.status}". Отмена доступна только для заказов со статусом "Добавлен" или "Готов".` 
          }, { status: 403 });
        }
      } else if (status === 'Возврат') {
        // Can return orders with status "Отправлен"
        if (currentOrder.status !== 'Отправлен') {
          console.log('Seller cannot return order with status:', currentOrder.status);
          return NextResponse.json({ 
            message: `Нельзя оформить возврат для заказа со статусом "${currentOrder.status}". Возврат доступен только для заказов со статусом "Отправлен".` 
          }, { status: 403 });
        }
      } else if (status === 'Исполнен') {
        // Allow sellers to mark orders as "Исполнен" when doing payouts
        // Orders must be "Готов" or "Отправлен" to be marked as "Исполнен"
        if (currentOrder.status !== 'Готов' && currentOrder.status !== 'Отправлен') {
          console.log('Seller cannot execute order with status:', currentOrder.status);
          return NextResponse.json({ 
            message: `Нельзя исполнить заказ со статусом "${currentOrder.status}". Исполнение доступно только для заказов со статусом "Готов" или "Отправлен".` 
          }, { status: 403 });
        }
      } else {
        console.log('Seller cannot change to status:', status);
        // Sellers cannot change orders to other statuses
        return NextResponse.json({ 
          message: 'Доступ запрещен: продавцы могут только отменять свои заказы, оформлять возврат или исполнять готовые заказы' 
        }, { status: 403 });
      }
    } else {
      console.log('Unknown role authorization failed:', user.role);
      // Any other role is not allowed
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    // Update the order status
    console.log('Updating order status to:', status);
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('Error updating order status:', error);
      throw error;
    }

    console.log('Order status updated successfully:', data);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Unhandled error in PATCH /api/orders/[orderId]:', error);
    
    if (error.name === 'ZodError') {
      console.log('Zod validation error:', error.errors);
      return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    
    console.log('Returning 500 error with message:', error.message);
    return NextResponse.json({ 
      message: 'Ошибка обновления статуса', 
      error: error.message,
      details: error.details || null,
      code: error.code || null
    }, { status: 500 });
  }
} 