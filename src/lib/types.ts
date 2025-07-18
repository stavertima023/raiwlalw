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

// Экстренная схема валидации - принимает любые данные
export const EmergencyOrderSchema = z.object({
  id: z.any().optional(), 
  orderDate: z.any().transform(() => new Date()), 
  orderNumber: z.any().transform(val => String(val || '').trim()),
  shipmentNumber: z.any().transform(val => String(val || '').trim()),
  status: z.any().transform(() => 'Добавлен'),
  productType: z.any().transform(val => {
    const str = String(val || '').trim();
    return ['фб', 'фч', 'хч', 'хб', 'хс', 'шч', 'лб', 'лч', 'другое'].includes(str) ? str : 'другое';
  }),
  size: z.any().transform(val => {
    const str = String(val || '').trim();
    return ['S', 'M', 'L', 'XL'].includes(str) ? str : 'M';
  }),
  seller: z.any().transform(val => String(val || '').trim()), 
  price: z.any().transform(val => {
    if (!val) return 0;
    const str = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) || num <= 0 ? 0 : num;
  }),
  cost: z.any().transform(val => {
    if (!val) return undefined;
    const str = String(val).replace(/[^\d.,]/g, '').replace(',', '.');
    const num = parseFloat(str);
    return isNaN(num) || num <= 0 ? undefined : num;
  }).optional(),
  photos: z.any().transform(val => {
    if (!Array.isArray(val)) return [];
    return val.filter(item => typeof item === 'string' && item.trim() !== '').slice(0, 3);
  }).optional().default([]),
  comment: z.any().transform(val => String(val || '').trim()),
});

// Используем экстренную схему вместо обычной
export const OrderSchema = EmergencyOrderSchema;

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
