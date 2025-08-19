import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { getSession } from '@/lib/session';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { orderId: string } }
) {
  console.log('🔄 PATCH /api/orders/[orderId]/printer-check - начало обработки запроса');
  
  try {
    // Проверяем сессию
    const session = await getSession();
    if (!session.isLoggedIn || !session.user) {
      console.log('❌ Пользователь не авторизован');
      return NextResponse.json(
        { error: 'Требуется авторизация' },
        { status: 401 }
      );
    }

    // Проверяем роль пользователя
    if (session.user.role !== 'Принтовщик') {
      console.log('❌ Недостаточно прав доступа, роль:', session.user.role);
      return NextResponse.json(
        { error: 'Только принтовщики могут изменять отметки заказов' },
        { status: 403 }
      );
    }

    // Получаем orderId из параметров
    const orderId = params.orderId;
    console.log('📋 ID заказа:', orderId);

    // Парсим тело запроса
    const body = await req.json();
    const { checked } = body;

    if (typeof checked !== 'boolean') {
      console.log('❌ Неверный тип данных для checked:', typeof checked);
      return NextResponse.json(
        { error: 'Поле checked должно быть булевым значением' },
        { status: 400 }
      );
    }

    console.log('✅ Обновляем отметку принтовщика для заказа', orderId, 'на:', checked);

    // Обновляем заказ в базе данных
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ printerChecked: checked })
      .eq('id', orderId)
      .select('id, orderNumber, printerChecked')
      .single();

    if (error) {
      console.error('❌ Ошибка обновления заказа в БД:', error);
      return NextResponse.json(
        { error: 'Не удалось обновить отметку заказа', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      console.log('❌ Заказ не найден:', orderId);
      return NextResponse.json(
        { error: 'Заказ не найден' },
        { status: 404 }
      );
    }

    console.log('✅ Отметка успешно обновлена:', data);

    return NextResponse.json({
      success: true,
      message: 'Отметка принтовщика обновлена',
      order: data
    });

  } catch (error) {
    console.error('❌ Ошибка обработки запроса PATCH /api/orders/[orderId]/printer-check:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
