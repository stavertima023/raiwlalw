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
  shipmentNumber: z.string().optional(),
  status: z.enum(['Добавлен', 'Готов', 'Отправлен', 'Исполнен', 'Отменен', 'Возврат']).default('Добавлен'),
  productType: z.string().min(1, 'Тип товара обязателен'),
  size: z.string().min(1, 'Размер обязателен'),
  seller: z.string().min(1, 'Продавец обязателен'),
  price: z.coerce.number().positive('Цена должна быть положительной'),
  cost: z.coerce.number().positive('Себестоимость должна быть положительной').optional(),
  photos: z.array(z.string()).optional(),
  comment: z.string().optional().default(''),
  ready_at: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional(),
});

export type Order = z.infer<typeof OrderSchema>;

// Тип для API ответов - используем базовый Order, но photos может быть undefined
export type OrderApiResponse = Order;

export const RoleEnum = z.enum(['Продавец', 'Принтовщик', 'Администратор']);
export type Role = z.infer<typeof RoleEnum>;

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  name: z.string(),
  password_hash: z.string().optional(),
  role: RoleEnum,
});

export type User = z.infer<typeof UserSchema>;


export const ExpenseCategoryEnum = z.enum([
  'Аренда',
  'Зарплата',
  'Расходники',
  'Маркетинг',
  'Налоги',
  'Ткань',
  'Курьер',
  'Расходники швейки',
  'Другое',
]);
export type ExpenseCategory = z.infer<typeof ExpenseCategoryEnum>;

export const ExpenseSchema = z.object({
  id: z.string().optional(),
  date: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  amount: z.coerce.number().positive('Сумма должна быть положительной'),
  category: ExpenseCategoryEnum,
  responsible: z.string(), // User's username
  comment: z.string().optional(),
  receiptPhoto: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
});

export type Expense = z.infer<typeof ExpenseSchema>;

export const PayoutStatusEnum = z.enum(['pending', 'processing', 'completed', 'cancelled']);
export type PayoutStatus = z.infer<typeof PayoutStatusEnum>;

export const PayoutSchema = z.object({
  id: z.string().optional(),
  date: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  seller: z.string().min(1, 'Продавец обязателен'),
  amount: z.coerce.number().positive('Сумма должна быть положительной'),
  orderNumbers: z.array(z.string()).min(1, 'Должен быть хотя бы один заказ'),
  orderCount: z.number().int().positive('Количество заказов должно быть положительным'),
  status: PayoutStatusEnum,
  processedBy: z.string().min(1, 'Ответственный обязателен'),
  comment: z.string().optional(),
});

export type Payout = z.infer<typeof PayoutSchema>;

// Расширенный тип для выплат с информацией о заказах
export interface PayoutWithOrders extends Payout {
  orders?: Order[];
  productTypeStats?: Record<string, number>;
  averageCheck?: number;
}

// Типы для системы долгов
export const DebtSchema = z.object({
  id: z.string(),
  person_name: z.string(),
  current_amount: z.number(),
  created_at: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  updated_at: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  is_temporary: z.boolean().optional(),
});

export const DebtPaymentSchema = z.object({
  id: z.string().optional(),
  debt_id: z.string(),
  payment_amount: z.coerce.number().positive('Сумма должна быть положительной'),
  remaining_debt: z.coerce.number().min(0, 'Остаток не может быть отрицательным'),
  payment_date: z.union([z.date(), z.string().transform((str) => new Date(str))]).optional(),
  receipt_photo: z.union([z.string().url(), z.literal(''), z.undefined()]).optional(),
  comment: z.string().optional(),
  processed_by: z.string().min(1, 'Ответственный обязателен'),
});

export type Debt = z.infer<typeof DebtSchema>;
export type DebtPayment = z.infer<typeof DebtPaymentSchema>;

export type SortDirection = 'asc' | 'desc';

export interface SortDescriptor {
  column: keyof Order;
  direction: SortDirection;
}
