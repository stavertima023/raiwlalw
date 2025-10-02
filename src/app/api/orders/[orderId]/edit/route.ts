import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { uploadBase64ToStorage } from '@/lib/storage';

const EditOrderSchema = z.object({
  shipmentNumber: z.string().min(1, 'Номер отправления обязателен'),
  productType: z.string().min(1, 'Тип обязателен'),
  size: z.string().min(1, 'Размер обязателен'),
  comment: z.string().optional().default(''),
  photos: z.array(z.string()).max(3).optional().default([]), // base64 images or already-hosted URLs
});

export async function PATCH(request: Request, { params }: { params: { orderId: string } }) {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
  }

  try {
    const { orderId } = params;
    const body = await request.json();
    const parsed = EditOrderSchema.parse(body);

    // Получаем текущий заказ
    const { data: currentOrder, error: fetchError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();
    if (fetchError || !currentOrder) {
      return NextResponse.json({ message: 'Заказ не найден' }, { status: 404 });
    }

    // Проверка прав: продавец может редактировать ТОЛЬКО свой заказ и только если статус "Добавлен"
    if (user.role === 'Продавец') {
      if (currentOrder.seller !== user.username) {
        return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
      }
      if (currentOrder.status !== 'Добавлен') {
        return NextResponse.json({ message: 'Редактирование доступно только для заказов со статусом "Добавлен"' }, { status: 403 });
      }
    } else if (user.role === 'Принтовщик' || user.role === 'Администратор') {
      // Разрешаем редактирование также принтовщику/админу при необходимости
    } else {
      return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
    }

    // Обрабатываем фото: объединяем существующие URL с новыми загрузками
    const incomingPhotos = Array.isArray(parsed.photos) ? parsed.photos : [];
    const existingUrls: string[] = Array.isArray(currentOrder.photos)
      ? (currentOrder.photos as string[]).filter((p) => typeof p === 'string' && !p.startsWith('data:'))
      : [];
    const inputUrls = incomingPhotos.filter((p) => typeof p === 'string' && !p.startsWith('data:'));
    const base64List = incomingPhotos.filter((p) => typeof p === 'string' && p.startsWith('data:'));

    const mergedStart = [...existingUrls, ...inputUrls];
    const uploadedUrls: string[] = [];
    let index = 0;
    for (const b64 of base64List) {
      if (mergedStart.length + uploadedUrls.length >= 3) break;
      try {
        const uploaded = await uploadBase64ToStorage({ base64: b64, orderId, seller: currentOrder.seller, index });
        uploadedUrls.push(uploaded.publicUrl);
        index += 1;
      } catch (_) {
        // пропускаем неудачные загрузки
      }
    }
    const finalPhotos = [...mergedStart, ...uploadedUrls].slice(0, 3);

    const updatePayload: any = {
      shipmentNumber: parsed.shipmentNumber,
      productType: parsed.productType,
      size: parsed.size,
      comment: parsed.comment || '',
    };
    updatePayload.photos = finalPhotos;

    const { data: updated, error: updateError } = await supabaseAdmin
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)
      .select('*')
      .single();
    if (updateError) throw updateError;

    return NextResponse.json(updated);
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Ошибка сохранения', error: error.message }, { status: 500 });
  }
}



