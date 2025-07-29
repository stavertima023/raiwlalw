import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { PayoutSchema } from '@/lib/types';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    // Both admins and sellers can view payouts
    if (user.role !== 'Администратор' && user.role !== 'Продавец') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    let query = supabaseAdmin
      .from('payouts')
      .select('*')
      .order('date', { ascending: false });

    // Sellers can only see their own payouts
    if (user.role === 'Продавец') {
      query = query.eq('processedBy', user.username);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Parse dates before sending to client
    const parsedData = data.map(item => ({
      ...item,
      date: new Date(item.date)
    }));

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('GET /api/payouts error:', error);
    return NextResponse.json({ 
      message: 'Ошибка загрузки выводов', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    // Both admins and sellers can create payouts
    if (user.role !== 'Администратор' && user.role !== 'Продавец') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const json = await request.json();
    console.log('📊 Получены данные для создания выплаты:', json);
    
    const { orderNumbers, ...otherData } = json;

    // If user is a seller, verify they own all the orders
    if (user.role === 'Продавец' && orderNumbers && orderNumbers.length > 0) {
      console.log('🔍 Проверяем заказы для продавца:', orderNumbers);
      
      const { data: orders, error: ordersError } = await supabaseAdmin
        .from('orders')
        .select('orderNumber, seller, status')
        .in('orderNumber', orderNumbers);

      if (ordersError) {
        console.error('❌ Ошибка при получении заказов:', ordersError);
        throw ordersError;
      }

      console.log('📋 Найденные заказы:', orders);

      // Check if all orders belong to the seller and are eligible for payout
      const invalidOrders = orders.filter(order => 
        order.seller !== user.username || 
        (order.status !== 'Готов' && order.status !== 'Отправлен')
      );

      if (invalidOrders.length > 0) {
        console.log('❌ Найдены невалидные заказы:', invalidOrders);
        return NextResponse.json({ 
          message: 'Вы можете создавать выплаты только для своих заказов со статусом "Готов" или "Отправлен"',
          invalidOrders: invalidOrders.map(o => o.orderNumber)
        }, { status: 403 });
      }

      // Update the orders status to "Исполнен" when payout is created by seller
      const { error: updateError } = await supabaseAdmin
        .from('orders')
        .update({ status: 'Исполнен' })
        .in('orderNumber', orderNumbers);

      if (updateError) {
        console.error('❌ Ошибка обновления статуса заказов:', updateError);
        // Don't fail the payout creation, just log the error
      } else {
        console.log('✅ Статус заказов обновлен на "Исполнен"');
      }
    }
    
    // Add processed by user and current date
    const payoutData = {
      ...json,
      processedBy: user.username,
      date: new Date().toISOString(),
      status: 'pending', // All payouts start as pending
    };
    
    console.log('📝 Данные выплаты для валидации:', payoutData);
    
    // Validate data with Zod schema
    const validatedPayout = PayoutSchema.omit({ id: true }).parse(payoutData);
    console.log('✅ Данные прошли валидацию:', validatedPayout);

    const { data, error } = await supabaseAdmin
      .from('payouts')
      .insert(validatedPayout)
      .select()
      .single();

    if (error) {
      console.error('❌ Ошибка при создании выплаты в БД:', error);
      throw error;
    }

    console.log('✅ Выплата успешно создана:', data);
    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      console.error('❌ Ошибка валидации Zod:', error.errors);
      return NextResponse.json({ 
        message: 'Ошибка валидации данных', 
        errors: error.errors 
      }, { status: 400 });
    }
    
    console.error('❌ POST /api/payouts error:', error);
    return NextResponse.json({ 
      message: 'Ошибка создания вывода', 
      error: error.message 
    }, { status: 500 });
  }
} 