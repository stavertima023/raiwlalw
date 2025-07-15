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
  id: z.string().optional(), 
  orderDate: z.union([z.date(), z.string().transform((str) => new Date(str))]), 
  orderNumber: z.string().min(1, 'Номер заказа обязателен'),
  shipmentNumber: z.string().min(1, 'Номер отправления обязателен'),
  status: OrderStatusEnum,
  productType: ProductTypeEnum,
  size: SizeEnum,
  seller: z.string().min(1, 'Продавец обязателен'), 
  price: z.coerce.number().positive('Цена должна быть положительной'),
  cost: z.coerce.number().positive('Себестоимость должна быть положительной'),
  photos: z.array(z.string()).max(3).optional().default([]), // Accept any string (base64 or URL)
  comment: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

export const RoleEnum = z.enum(['Продавец', 'Принтовщик', 'Администратор']);
export type Role = z.infer<typeof RoleEnum>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  password_hash: z.string(),
  role: RoleEnum,
});

export type User = z.infer<typeof UserSchema>;


export const ExpenseCategoryEnum = z.enum([
  'Аренда',
  'Зарплата',
  'Расходники',
  'Маркетинг',
  'Налоги',
  'Другое',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const ExpenseSchema = z.object({
  id: z.string(),
  date: z.date(),
  amount: z.coerce.number().positive('Сумма должна быть положительной'),
  category: ExpenseCategoryEnum,
  responsible: z.string(), // User's telegramId
  comment: z.string().optional(),
  receiptPhoto: z.string().url().optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export type SortDirection = 'asc' | 'desc';

export interface SortDescriptor {
  column: keyof Order;
  direction: SortDirection;
}
