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
  order_date: z.union([z.date(), z.string().transform((str) => new Date(str))]), 
  orderNumber: z.string().min(1, 'Номер заказа обязателен'),
  shipmentNumber: z.string().min(1, 'Номер отправления обязателен'),
  status: OrderStatusEnum,
  productType: ProductTypeEnum,
  size: SizeEnum,
  seller: z.string().min(1, 'Продавец обязателен'), 
  price: z.coerce.number().positive('Цена должна быть положительной'),
  cost: z.coerce.number().positive('Себестоимость должна быть положительной').optional(),
  photos: z.array(z.string()).max(3).optional().default([]),
  comment: z.string().optional(),
});

export type Order = z.infer<typeof OrderSchema>;

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
  id: z.string(),
  date: z.union([z.date(), z.string().transform((str) => new Date(str))]),
  amount: z.coerce.number().positive('Сумма должна быть положительной'),
  category: ExpenseCategoryEnum,
  responsible: z.string(), // User's username
  comment: z.string().optional(),
  receiptPhoto: z.string().optional(), // Proper camelCase naming
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

export type SortDirection = 'asc' | 'desc';

export interface SortDescriptor {
  column: keyof Order;
  direction: SortDirection;
}

// Analytics types
export interface AnalyticsData {
  totalOrders: number;
  ordersByStatus: Record<OrderStatus, number>;
  totalPayouts: number;
  averageOrderPrice: number;
  expensesByCategory: Record<ExpenseCategory, number>;
}

export interface AnalyticsFilters {
  dateFrom?: string;
  dateTo?: string;
  sellers?: string[];
}
