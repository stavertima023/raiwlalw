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
  orderDate: z.union([
    z.date(), 
    z.string().transform((str) => {
      if (!str) return new Date();
      try {
        return new Date(str);
      } catch {
        return new Date();
      }
    }),
    z.undefined().transform(() => new Date())
  ]), 
  orderNumber: z.union([
    z.string().min(1, 'Номер заказа обязателен'),
    z.undefined()
  ]).transform(val => (val || '').trim()),
  shipmentNumber: z.union([
    z.string().min(1, 'Номер отправления обязателен'),
    z.undefined()
  ]).transform(val => (val || '').trim()),
  status: z.union([
    OrderStatusEnum, 
    z.literal(''), 
    z.undefined()
  ]).transform(val => val || 'Добавлен'),
  productType: z.union([
    ProductTypeEnum, 
    z.literal(''), 
    z.undefined()
  ]).refine(val => !val || ProductTypeEnum.options.includes(val as any), {
    message: 'Выберите тип товара'
  }).transform(val => val || undefined),
  size: z.union([
    SizeEnum, 
    z.literal(''), 
    z.undefined()
  ]).refine(val => !val || SizeEnum.options.includes(val as any), {
    message: 'Выберите размер'
  }).transform(val => val || undefined),
  seller: z.union([
    z.string().min(1, 'Продавец обязателен'),
    z.undefined()
  ]).transform(val => (val || '').trim()), 
  price: z.union([
    z.coerce.number().positive('Цена должна быть положительной'),
    z.string().transform(val => {
      if (!val || val.trim() === '') throw new Error('Цена обязательна');
      const num = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(num) || num <= 0) throw new Error('Цена должна быть положительной');
      return num;
    }),
    z.undefined()
  ]).refine(val => val !== undefined && val > 0, {
    message: 'Цена должна быть положительной'
  }),
  cost: z.union([
    z.coerce.number().positive('Себестоимость должна быть положительной'),
    z.string().transform(val => {
      if (!val || val.trim() === '') return undefined;
      const num = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
      if (isNaN(num) || num <= 0) throw new Error('Себестоимость должна быть положительной');
      return num;
    }),
    z.undefined()
  ]).optional(),
  photos: z.union([
    z.array(z.string()).max(3),
    z.array(z.any()).transform(arr => arr.filter(item => typeof item === 'string')).pipe(z.array(z.string()).max(3)),
    z.undefined()
  ]).optional().default([]),
  comment: z.union([
    z.string(),
    z.undefined()
  ]).optional().default('').transform(val => val || ''),
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
