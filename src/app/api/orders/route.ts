import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';

export async function GET() {
  try {
    console.log('GET /api/orders - Starting...');
    
    // Check supabaseAdmin availability
    if (!supabaseAdmin) {
      console.error('supabaseAdmin not available');
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }
    
    const session = await getSession();
    console.log('Session retrieved:', { isLoggedIn: session.isLoggedIn, hasUser: !!session.user });
    
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.log('User not authenticated');
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    let query = supabaseAdmin.from('orders').select('*').order('orderDate', { ascending: false });

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
    const parsedData = data.map(item => ({
      ...item,
      orderDate: new Date(item.orderDate),
    }));

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ message: 'Ошибка загрузки заказов', error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    console.log('POST /api/orders - Starting...');
    
    // Step 1: Environment Check
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.json({ 
        message: 'Ошибка конфигурации сервера',
        debug: 'Missing SUPABASE environment variables'
      }, { status: 500 });
    }
    
    if (!process.env.SESSION_SECRET) {
      console.error('Missing SESSION_SECRET');
      return NextResponse.json({ 
        message: 'Ошибка конфигурации сессии',
        debug: 'Missing SESSION_SECRET'
      }, { status: 500 });
    }

    // Step 2: Supabase Connection Check
    if (!supabaseAdmin) {
      console.error('supabaseAdmin not available');
      return NextResponse.json({ 
        message: 'Сервис недоступен',
        debug: 'supabaseAdmin not initialized'
      }, { status: 503 });
    }

    // Step 3: Session Check
    let session;
    try {
      session = await getSession();
      console.log('Session check result:', { 
        isLoggedIn: session.isLoggedIn, 
        hasUser: !!session.user,
        username: session.user?.username,
        role: session.user?.role
      });
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      return NextResponse.json({ 
        message: 'Ошибка авторизации',
        debug: 'Session retrieval failed',
        error: (sessionError as Error).message
      }, { status: 401 });
    }
    
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      console.log('User not authenticated');
      return NextResponse.json({ 
        message: 'Пользователь не авторизован',
        debug: 'No user or not logged in'
      }, { status: 401 });
    }

    // Step 4: Parse Request Body
    let json;
    try {
      json = await request.json();
      console.log('Received order data:', json);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json({ 
        message: 'Неверный формат данных',
        debug: 'Failed to parse JSON request body',
        error: (parseError as Error).message
      }, { status: 400 });
    }
    
    // Step 5: Data Preparation
    const newOrderData = {
      ...json,
      seller: user.username,
      orderDate: new Date().toISOString(),
      status: 'Добавлен',
      cost: json.cost || null,
      photos: Array.isArray(json.photos) ? json.photos : [],
      comment: json.comment || '',
    };
    
    console.log('Prepared order data:', newOrderData);
    
    // Step 6: Data Validation
    let validatedOrder;
    try {
      validatedOrder = OrderSchema.omit({ id: true }).parse(newOrderData);
      console.log('Validation successful:', validatedOrder);
    } catch (validationError: any) {
      console.error('Validation failed:', validationError);
      
      // Format Zod errors nicely
      if (validationError.errors) {
        const errorDetails = validationError.errors.map((e: any) => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
          received: e.received
        }));
        
        return NextResponse.json({ 
          message: 'Ошибка валидации данных',
          debug: 'Zod validation failed',
          errors: errorDetails,
          originalData: newOrderData
        }, { status: 400 });
      }
      
      return NextResponse.json({ 
        message: 'Ошибка валидации данных',
        debug: 'Unknown validation error',
        error: validationError.message,
        originalData: newOrderData
      }, { status: 400 });
    }

    // Step 6.5: Format data for Supabase - try both formats for debugging
    const supabaseOrderData = {
      "orderDate": validatedOrder.orderDate,
      "orderNumber": validatedOrder.orderNumber,
      "shipmentNumber": validatedOrder.shipmentNumber,
      status: validatedOrder.status,
      "productType": validatedOrder.productType,
      size: validatedOrder.size,
      seller: validatedOrder.seller,
      price: validatedOrder.price,
      cost: validatedOrder.cost,
      photos: validatedOrder.photos,
      comment: validatedOrder.comment,
    };
    
    console.log('Supabase-formatted order data (quoted camelCase):', supabaseOrderData);
    
    // Also try snake_case version as backup
    const supabaseOrderDataSnakeCase = {
      order_date: validatedOrder.orderDate,
      order_number: validatedOrder.orderNumber,
      shipment_number: validatedOrder.shipmentNumber,
      status: validatedOrder.status,
      product_type: validatedOrder.productType,
      size: validatedOrder.size,
      seller: validatedOrder.seller,
      price: validatedOrder.price,
      cost: validatedOrder.cost,
      photos: validatedOrder.photos,
      comment: validatedOrder.comment,
    };
    
    console.log('Supabase-formatted order data (snake_case):', supabaseOrderDataSnakeCase);

    // Step 7: Database Connection Test
    try {
      const { error: testError } = await supabaseAdmin.from('orders').select('count').limit(1);
      if (testError) {
        console.error('Supabase connection test failed:', testError);
        return NextResponse.json({ 
          message: 'Ошибка подключения к базе данных',
          debug: 'Supabase connection test failed',
          error: testError.message,
          supabaseError: testError
        }, { status: 500 });
      }
    } catch (testError) {
      console.error('Supabase connection test exception:', testError);
      return NextResponse.json({ 
        message: 'Ошибка подключения к базе данных',
        debug: 'Supabase connection test threw exception',
        error: (testError as Error).message
      }, { status: 500 });
    }

    // Step 8: Database Insert - try different formats
    try {
      console.log('Attempting insert with quoted camelCase format...');
      
      // First try with quoted camelCase format
      let { data, error } = await supabaseAdmin
        .from('orders')
        .insert(supabaseOrderData)
        .select()
        .single();

      if (error) {
        console.error('Quoted camelCase insert failed:', error);
        
        // If camelCase failed, try snake_case
        if (error.code === '42703' || error.message.includes('has no field')) {
          console.log('Trying insert with snake_case format...');
          
          const result = await supabaseAdmin
            .from('orders')
            .insert(supabaseOrderDataSnakeCase)
            .select()
            .single();
          
          data = result.data;
          error = result.error;
          
          if (error) {
            console.error('Snake_case insert also failed:', error);
            throw error;
          } else {
            console.log('Snake_case insert succeeded!');
          }
        } else {
          throw error;
        }
      } else {
        console.log('Quoted camelCase insert succeeded!');
      }

      console.log('Order created successfully:', data);
      
      // Convert orderDate to proper Date object for frontend
      const responseData = {
        ...data,
        orderDate: new Date(data.orderDate || data.order_date),
        orderNumber: data.orderNumber || data.order_number,
        shipmentNumber: data.shipmentNumber || data.shipment_number,
        productType: data.productType || data.product_type,
      };
      
      return NextResponse.json(responseData, { status: 201 });

    } catch (insertError) {
      console.error('Database insert exception:', insertError);
      return NextResponse.json({ 
        message: 'Ошибка сохранения в базе данных',
        debug: 'Supabase insert failed',
        error: (insertError as any).message,
        code: (insertError as any).code,
        details: (insertError as any).details,
        hint: (insertError as any).hint,
        supabaseError: insertError
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('POST /api/orders - Unexpected error:', error);
    
    return NextResponse.json({ 
      message: 'Неожиданная ошибка сервера',
      debug: 'Unexpected server error',
      error: error.message || 'Unknown error',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 });
  }
} 