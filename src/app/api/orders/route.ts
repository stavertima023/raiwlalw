import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { OrderSchema } from '@/lib/types';

export async function GET() {
  try {
    // Check supabaseAdmin availability
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }
    
    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    // Оптимизированный запрос с выбором только нужных полей
    let query = supabaseAdmin
      .from('orders')
      .select('id, orderDate, orderNumber, shipmentNumber, status, productType, size, seller, price, cost, photos, comment')
      .order('orderDate', { ascending: false });

    // Если пользователь продавец, фильтруем только его заказы
    if (user.role === 'Продавец') {
      query = query.eq('seller', user.username);
    }
    
    const { data, error } = await query;

    if (error) {
      throw error;
    }

    // Парсим даты и возвращаем данные
    const parsedData = data.map(item => ({
      ...item, 
      orderDate: new Date(item.orderDate)
    }));

    return NextResponse.json(parsedData);
  } catch (error: any) {
    return NextResponse.json({ 
      message: 'Ошибка загрузки заказов', 
      error: error.message 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  let json: any;
  
  try {
    // Проверяем доступность сервисов
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
    }

    json = await request.json();
    
    // Максимально толерантная обработка данных
    const cleanedData = {
      ...json,
      // Принимаем любые данные и преобразуем их
      orderNumber: json.orderNumber,
      shipmentNumber: json.shipmentNumber,
      productType: json.productType,
      size: json.size,
      price: json.price,
      cost: json.cost,
      comment: json.comment,
      photos: json.photos,
      
      // Устанавливаем продавца и дату
      seller: user.username,
      orderDate: new Date().toISOString(),
    };
    
    // Валидируем данные с помощью Zod
    const validatedOrder = OrderSchema.omit({ id: true }).parse(cleanedData);

    // Вставляем заказ в базу данных
    const { data, error } = await supabaseAdmin
      .from('orders')
      .insert(validatedOrder)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Парсим дату перед отправкой ответа
    const result = {
      ...data,
      orderDate: new Date(data.orderDate)
    };

    return NextResponse.json(result, { status: 201 });

  } catch (error: any) {
    // Обрабатываем ошибки валидации Zod
    if (error.name === 'ZodError') {
      const errorDetails = error.errors.map((err: any) => {
        const field = err.path.join('.');
        const message = err.message;
        const received = err.received;
        const code = err.code;
        return `${field}: ${message} (код: ${code}, получено: ${JSON.stringify(received)})`;
      }).join(', ');
      
      console.error('Validation error details:', {
        errors: error.errors,
        receivedData: json,
        userAgent: request.headers.get('user-agent'),
        contentType: request.headers.get('content-type')
      });
      
      return NextResponse.json({ 
        message: 'Ошибка валидации данных', 
        error: errorDetails,
        errors: error.errors,
        receivedData: json,
        userAgent: request.headers.get('user-agent')
      }, { status: 400 });
    }
    
    // Обрабатываем ошибки Supabase
    if (error.code) {
      return NextResponse.json({ 
        message: 'Ошибка базы данных', 
        error: error.message,
        code: error.code
      }, { status: 500 });
    }
    
    return NextResponse.json({ 
      message: 'Ошибка добавления заказа', 
      error: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 