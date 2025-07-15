import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';

export async function GET() {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  try {
    let query = supabase.from('orders').select('*').order('orderDate', { ascending: false });

    // If the user is a seller, only fetch their orders
    if (user.role === 'Продавец') {
      query = query.eq('seller', user.username);
    }
    
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Parse dates before sending to client
    const parsedData = data.map(item => ({...item, orderDate: new Date(item.orderDate) }))

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ message: 'Ошибка загрузки заказов', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  try {
    const json = await request.json();
    console.log('Received order data:', json);
    
    // Automatically set the seller and orderDate
    const newOrderData = {
      ...json,
      seller: user.username,
      orderDate: new Date(),
    };
    
    console.log('Order data with seller and date:', newOrderData);
    
    // Validate data with Zod schema before inserting
    const validatedOrder = OrderSchema.omit({ id: true }).parse(newOrderData);
    
    console.log('Validated order:', validatedOrder);

    const { data, error } = await supabase.from('orders').insert(validatedOrder).select().single();

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('Full error object:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
       return NextResponse.json({ 
         message: 'Ошибка валидации данных', 
         errors: error.errors,
         receivedData: request.method === 'POST' ? await request.text() : undefined 
       }, { status: 400 });
    }
    
    // Handle Supabase errors specifically
    if (error.code) {
      return NextResponse.json({ 
        message: 'Ошибка базы данных', 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Ошибка добавления заказа', 
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 