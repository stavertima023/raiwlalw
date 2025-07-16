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

    // Call OpenAI API
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `Ты аналитик для производственной компании. У тебя есть данные о заказах и расходах. 
            Анализируй данные и предоставляй инсайты на русском языке.
            Данные о заказах: ${JSON.stringify(analyticsData.orders)}
            Данные о расходах: ${JSON.stringify(analyticsData.expenses)}`
          },
          {
            role: 'user',
            content: query
          }
        ],
        max_tokens: 1000,
        temperature: 0.7,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || 'Unknown error'}`);
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
        totalRevenue: orders.reduce((sum, order) => sum + Number(order.price), 0),
        totalExpenses: expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)
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