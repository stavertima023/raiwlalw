import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabase } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';

export async function GET() {
  try {
    console.log('GET /api/orders - Starting...');
    
    // Check environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ message: 'Ошибка конфигурации сервера' }, { status: 500 });
    }
    
    const session = await getSession();
    console.log('Session retrieved:', { isLoggedIn: session.isLoggedIn, hasUser: !!session.user });
    
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.log('User not authenticated');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    let query = supabase.from('orders').select('*').order('orderDate', { ascending: false });

    // If the user is a seller, only fetch their orders
    if (user.role === 'Продавец') {
      query = query.eq('seller', user.username);
    }
    
    const { data, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }

    // Parse dates before sending to client
    const parsedData = data.map(item => ({...item, orderDate: new Date(item.orderDate) }))

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ message: 'Ошибка загрузки заказов', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/orders - Starting...');
    
    // Check environment variables first
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ message: 'Ошибка конфигурации сервера' }, { status: 500 });
    }
    
    // Check session secret
    if (!process.env.SESSION_SECRET) {
      console.error('Missing SESSION_SECRET');
      return NextResponse.json({ message: 'Ошибка конфигурации сессии' }, { status: 500 });
    }

    const session = await getSession();
    console.log('Session retrieved:', { isLoggedIn: session.isLoggedIn, hasUser: !!session.user });
    
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.log('User not authenticated');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    const json = await request.json();
    console.log('Received order data:', json);
    
    // Automatically set the seller and orderDate
    const newOrderData = {
      ...json,
      seller: user.username,
      orderDate: new Date().toISOString(), // Use ISO string for better database compatibility
    };
    
    console.log('Order data with seller and date:', newOrderData);
    
    // Validate data with Zod schema before inserting
    const validatedOrder = OrderSchema.omit({ id: true }).parse(newOrderData);
    
    console.log('Validated order:', validatedOrder);

    // Test Supabase connection
    const { data: testData, error: testError } = await supabase.from('orders').select('count').limit(1);
    if (testError) {
      console.error('Supabase connection test failed:', testError);
      return NextResponse.json({ 
        message: 'Ошибка подключения к базе данных', 
        error: testError.message 
      }, { status: 500 });
    }

    const { data, error } = await supabase.from('orders').insert(validatedOrder).select().single();

    if (error) {
      console.error('Supabase insert error:', error);
      throw error;
    }

    console.log('Order created successfully:', data);
    return NextResponse.json(data, { status: 201 });

  } catch (error: any) {
    console.error('POST /api/orders - Full error object:', error);
    
    // Handle Zod validation errors
    if (error.name === 'ZodError') {
       console.error('Zod validation errors:', error.errors);
       return NextResponse.json({ 
         message: 'Ошибка валидации данных', 
         errors: error.errors
       }, { status: 400 });
    }
    
    // Handle Supabase errors specifically
    if (error.code) {
      console.error('Supabase error details:', { code: error.code, message: error.message, details: error.details });
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