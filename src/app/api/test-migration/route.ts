import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn) {
      return NextResponse.json({ message: 'Не авторизован' }, { status: 401 });
    }

    // Проверяем доступность Supabase
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Supabase недоступен' }, { status: 503 });
    }

    // Получаем первые 3 вывода для тестирования
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .limit(3);

    if (payoutsError) {
      return NextResponse.json({ 
        error: 'Ошибка загрузки выводов', 
        details: payoutsError.message 
      }, { status: 500 });
    }

    // Проверяем структуру данных
    const payoutStructure = payouts.map(p => ({
      id: p.id,
      hasOrderNumbers: !!p.orderNumbers,
      orderNumbersCount: p.orderNumbers?.length || 0,
      hasProductTypeStats: !!p.productTypeStats,
      productTypeStatsKeys: p.productTypeStats ? Object.keys(p.productTypeStats) : [],
      hasOrderCount: typeof p.orderCount === 'number',
      hasAverageCheck: typeof p.averageCheck === 'number',
    }));

    return NextResponse.json({
      user: user.username,
      role: user.role,
      payoutsFound: payouts.length,
      structure: payoutStructure,
      migrationEndpointAvailable: true,
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Ошибка тестирования', 
      message: error.message 
    }, { status: 500 });
  }
}
