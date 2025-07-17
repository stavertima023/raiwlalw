// Types for analytics component without Zod dependencies
export interface Order {
  id?: string;
  orderDate: string | Date;
  orderNumber: string;
  shipmentNumber: string;
  status: 'Добавлен' | 'Готов' | 'Отправлен' | 'Исполнен' | 'Отменен' | 'Возврат';
  productType: 'фб' | 'фч' | 'хч' | 'хб' | 'хс' | 'шч' | 'лб' | 'лч' | 'другое';
  size: 'S' | 'M' | 'L' | 'XL';
  seller: string;
  price: number;
  cost?: number;
  photos?: string[];
  comment?: string;
}

export interface User {
  id: string;
  username: string;
  name: string;
  password_hash?: string;
  role: 'Продавец' | 'Принтовщик' | 'Администратор';
}

export interface Expense {
  id: string;
  date: string | Date;
  amount: number;
  category: 'Аренда' | 'Зарплата' | 'Расходники' | 'Маркетинг' | 'Налоги' | 'Другое';
  responsible: string;
  comment?: string;
  receiptPhoto?: string;
}

export interface Payout {
  id?: string;
  date: string | Date;
  seller: string;
  amount: number;
  orderNumbers: string[];
  orderCount: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled';
  processedBy: string;
  comment?: string;
} 