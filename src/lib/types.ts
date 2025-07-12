import { z } from 'zod';

export const OrderStatusEnum = z.enum([
  'Добавлен',
  'Готов',
  'Отправлен',
  'Исполнен',
  'Отменен',
  'Возврат',
]);
export type OrderStatus = z.infer<typeof OrderStatusEnum>;

export const ProductTypeEnum = z.enum([
  'фб',
  'фч',
  'хч',
  'хб',
  'хс',
  'шч',
  'лб',
  'лч',
  'другое',
]);
export type ProductType = z.infer<typeof ProductTypeEnum>;

export const SizeEnum = z.enum(['S', 'M', 'L', 'XL']);
export type Size = z.infer<typeof SizeEnum>;

export const OrderSchema = z.object({
  id: z.string(),
  orderDate: z.date(),
  orderNumber: z.string().min(1, 'Номер заказа обязателен'),
  shipmentNumber: z.string().optional(),
  status: OrderStatusEnum,
  productType: ProductTypeEnum,
  size: SizeEnum,
  seller: z.string().min(1, 'Продавец обязателен'),
  price: z.coerce.number().positive('Цена должна быть положительной'),
  cost: z.coerce.number().positive('Себестоимость должна быть положительной'),
  photos: z.array(z.string().url()).max(3).optional().default([]),
});

export type Order = z.infer<typeof OrderSchema>;
