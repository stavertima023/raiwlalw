import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

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

    // Only admins can access AI analytics
    if (user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    const { query } = await request.json();

    if (!query) {
      return NextResponse.json({ message: 'Запрос обязателен' }, { status: 400 });
    }

    // Get orders data
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .order('orderDate', { ascending: false });

    if (ordersError) {
      throw new Error(`Ошибка загрузки заказов: ${ordersError.message}`);
    }

    // Get expenses data
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('*')
      .order('date', { ascending: false });

    if (expensesError) {
      throw new Error(`Ошибка загрузки расходов: ${expensesError.message}`);
    }

    // Prepare data for AI analysis
    const analyticsData = {
      orders: orders.map(order => ({
        date: order.orderDate,
        status: order.status,
        price: order.price,
        productType: order.productType,
        seller: order.seller
      })),
      expenses: expenses.map(expense => ({
        date: expense.date,
        amount: expense.amount,
        category: expense.category
      }))
    };

    // Use the provided OpenAI API key
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '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';

    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key не настроен');
    }

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Ты профессиональный аналитик данных для российской компании, занимающейся продажами через маркетплейсы. 
            
            Анализируй предоставленные данные и отвечай на русском языке. Твои ответы должны быть содержательными и конкретными.
            
            Данные о заказах включают: дату, статус, цену, тип товара, продавца.
            Данные о расходах включают: дату, сумму, категорию.
            
            Типы товаров: фб, фч, хч, хб, хс, шч, лб, лч, другое
            Статусы заказов: Добавлен, Готов, Отправлен, Исполнен, Отменен, Возврат
            
            Предоставляй конкретные цифры, тренды, рекомендации. Форматируй числа в российском формате.`
          },
          {
            role: 'user',
            content: `Вопрос: ${query}

Данные о заказах (${orders.length} записей):
${JSON.stringify(analyticsData.orders, null, 2)}

Данные о расходах (${expenses.length} записей):
${JSON.stringify(analyticsData.expenses, null, 2)}`
          }
        ],
        max_tokens: 1500,
        temperature: 0.3,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json().catch(() => ({ error: { message: 'Unknown error' } }));
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${errorData.error?.message || `HTTP ${openaiResponse.status}`}`);
    }

    const openaiData = await openaiResponse.json();
    const analysis = openaiData.choices[0]?.message?.content;

    if (!analysis) {
      throw new Error('Не удалось получить ответ от AI');
    }

    return NextResponse.json({ 
      analysis,
      dataPoints: {
        ordersCount: orders.length,
        expensesCount: expenses.length,
        totalRevenue: orders.reduce((sum, order) => sum + Number(order.price || 0), 0),
        totalExpenses: expenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0)
      }
    });

  } catch (error: any) {
    console.error('AI Analytics error:', error);
    return NextResponse.json({ 
      message: 'Ошибка AI анализа', 
      error: error.message 
    }, { status: 500 });
  }
} 