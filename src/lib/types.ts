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
  id: z.string().optional(), // Optional for form state
  orderDate: z.date().optional(), // Optional for form state
  orderNumber: z.string().min(1, 'Номер заказа обязателен'),
  shipmentNumber: z.string().optional(),
  status: OrderStatusEnum,
  productType: ProductTypeEnum,
  size: SizeEnum,
  seller: z.string().min(1, 'Продавец обязателен'), // This will store the User's telegramId
  price: z.coerce.number().positive('Цена должна быть положительной'),
  cost: z.coerce.number().positive('Себестоимость должна быть положительной'),
  photos: z.array(z.string().url()).max(3).optional().default([]),
  comment: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const RoleEnum = z.enum(['Продавец', 'Принтовщик']);
export type Role = z.infer<typeof RoleEnum>;

export const UserSchema = z.object({
  telegramId: z.string(),
  name: z.string(),
  role: RoleEnum,
  position: z.string(),
});

export type User = z.infer<typeof UserSchema>;
