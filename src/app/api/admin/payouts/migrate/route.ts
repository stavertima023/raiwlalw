import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn || user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    console.log('🔄 Начинаем миграцию выводов...');

    // Получаем все выводы
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('payouts')
      .select('*')
      .order('date', { ascending: false });

    if (payoutsError) {
      throw new Error(`Ошибка загрузки выводов: ${payoutsError.message}`);
    }

    console.log(`📊 Найдено ${payouts.length} выводов для обновления`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const payout of payouts) {
      try {
        // Проверяем, есть ли у вывода номера заказов
        if (!payout.orderNumbers || !Array.isArray(payout.orderNumbers) || payout.orderNumbers.length === 0) {
          console.log(`⚠️ Пропускаем вывод ${payout.id} - нет номеров заказов`);
          skippedCount++;
          continue;
        }

        // Получаем данные заказов для этого вывода
        const { data: orders, error: ordersError } = await supabaseAdmin
          .from('orders')
          .select('id, orderNumber, productType, price, size, status, orderDate')
          .in('orderNumber', payout.orderNumbers);

        if (ordersError) {
          console.error(`❌ Ошибка получения заказов для вывода ${payout.id}:`, ordersError);
          skippedCount++;
          continue;
        }

        if (!orders || orders.length === 0) {
          console.log(`⚠️ Пропускаем вывод ${payout.id} - заказы не найдены`);
          skippedCount++;
          continue;
        }

        // Рассчитываем статистику по типам товаров
        const productTypeStats: Record<string, number> = {};
        let totalAmount = 0;

        orders.forEach(order => {
          productTypeStats[order.productType] = (productTypeStats[order.productType] || 0) + 1;
          totalAmount += order.price;
        });

        const orderCount = orders.length;
        const averageCheck = totalAmount > 0 ? totalAmount / orderCount : 0;

        // Обновляем вывод с новой статистикой
        const { error: updateError } = await supabaseAdmin
          .from('payouts')
          .update({
            orderCount,
            averageCheck: Math.round(averageCheck * 100) / 100, // Округляем до 2 знаков
            productTypeStats
          })
          .eq('id', payout.id);

        if (updateError) {
          console.error(`❌ Ошибка обновления вывода ${payout.id}:`, updateError);
          skippedCount++;
          continue;
        }

        console.log(`✅ Обновлен вывод ${payout.id}: ${orderCount} заказов, ${Object.keys(productTypeStats).length} типов товаров`);
        updatedCount++;

        // Небольшая пауза между обновлениями для предотвращения перегрузки
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`❌ Ошибка обработки вывода ${payout.id}:`, error);
        skippedCount++;
      }
    }

    console.log(`🎉 Миграция завершена: обновлено ${updatedCount}, пропущено ${skippedCount}`);

    return NextResponse.json({
      success: true,
      message: 'Миграция выводов успешно завершена',
      stats: {
        totalPayouts: payouts.length,
        updatedCount,
        skippedCount
      }
    });

  } catch (error: any) {
    console.error('❌ Ошибка миграции выводов:', error);
    return NextResponse.json({
      success: false,
      message: 'Ошибка миграции выводов',
      error: error.message
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
    }

    const session = await getSession();
    const { user } = session;

    if (!user || !session.isLoggedIn || user.role !== 'Администратор') {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    // Проверяем статус миграции - сколько выводов нуждается в обновлении
    const { data: payouts, error: payoutsError } = await supabaseAdmin
      .from('payouts')
      .select('id, orderNumbers, productTypeStats, orderCount, averageCheck');

    if (payoutsError) {
      throw new Error(`Ошибка загрузки выводов: ${payoutsError.message}`);
    }

    const needsUpdate = payouts.filter(payout => 
      payout.orderNumbers && 
      Array.isArray(payout.orderNumbers) && 
      payout.orderNumbers.length > 0 && 
      (!payout.productTypeStats || Object.keys(payout.productTypeStats || {}).length === 0)
    );

    const alreadyMigrated = payouts.filter(payout => 
      payout.productTypeStats && 
      Object.keys(payout.productTypeStats).length > 0
    );

    return NextResponse.json({
      totalPayouts: payouts.length,
      needsUpdate: needsUpdate.length,
      alreadyMigrated: alreadyMigrated.length,
      ready: needsUpdate.length > 0
    });

  } catch (error: any) {
    console.error('❌ Ошибка проверки статуса миграции:', error);
    return NextResponse.json({
      message: 'Ошибка проверки статуса',
      error: error.message
    }, { status: 500 });
  }
}
