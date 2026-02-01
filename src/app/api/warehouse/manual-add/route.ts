import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { uploadBase64ToStorage } from '@/lib/storage';
import { z } from 'zod';
import { ProductTypeEnum, SizeEnum } from '@/lib/types';

const ManualWarehouseOrderSchema = z.object({
  productType: ProductTypeEnum,
  size: SizeEnum,
  photos: z.array(z.string()).max(2).optional().default([]),
  orderNumber: z.string().optional(),
  shipmentNumber: z.string().optional(),
  price: z.coerce.number().positive().optional(),
  comment: z.string().optional().default(''),
});

export async function POST(request: Request) {
  const session = await getSession();
  const { user } = session;

  if (!user || !session.isLoggedIn) {
    return NextResponse.json({ message: 'Пользователь не авторизован' }, { status: 401 });
  }

  if (user.role !== 'Принтовщик') {
    return NextResponse.json({ message: 'Доступ запрещен' }, { status: 403 });
  }

  if (!supabaseAdmin) {
    return NextResponse.json({ message: 'Сервис недоступен' }, { status: 503 });
  }

  try {
    const body = await request.json();
    const validated = ManualWarehouseOrderSchema.parse(body);

    // Генерируем уникальный номер заказа, если не указан
    const orderNumber = validated.orderNumber || `WH-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    
    // Генерируем номер отправления, если не указан
    const shipmentNumber = validated.shipmentNumber || `SHP-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    // Создаем заказ без фото сначала
    const { photos: base64Photos, ...rest } = validated as any;
    const orderData = {
      orderNumber,
      shipmentNumber,
      productType: validated.productType,
      size: validated.size,
      seller: user.username, // От имени принтовщика
      price: validated.price || 0,
      cost: validated.price ? Math.round(validated.price * 0.5) : 0,
      status: 'Возврат' as const,
      on_warehouse: true,
      manual_warehouse: true, // Не показывать в списке админа и аналитике
      comment: validated.comment || '',
      photos: [] as string[],
    };

    const { data: created, error: createError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select('id')
      .single();

    if (createError) {
      throw createError;
    }

    // Загружаем фото, если есть
    if (Array.isArray(base64Photos) && base64Photos.length > 0) {
      const uploaded: string[] = [];
      let index = 0;
      for (const b64 of base64Photos.slice(0, 2)) {
        try {
          const result = await uploadBase64ToStorage({
            base64: b64,
            orderId: created.id,
            seller: user.username,
            index,
          });
          uploaded.push(result.publicUrl);
          index += 1;
        } catch (e) {
          console.warn('Не удалось загрузить фото в Storage:', e);
        }
      }
      if (uploaded.length > 0) {
        const { error: updatePhotosError } = await supabaseAdmin
          .from('orders')
          .update({ photos: uploaded })
          .eq('id', created.id);
        if (updatePhotosError) throw updatePhotosError;
      }
    }

    // Получаем полный заказ для ответа
    const { data: finalOrder } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', created.id)
      .single();

    return NextResponse.json({
      message: 'Заказ успешно добавлен на склад',
      order: { ...finalOrder, orderDate: new Date(finalOrder.orderDate) }
    }, { status: 201 });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return NextResponse.json({ message: 'Ошибка валидации данных', errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: 'Ошибка добавления заказа', error: error.message }, { status: 500 });
  }
}
