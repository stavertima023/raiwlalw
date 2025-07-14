import type { Order, User, Expense } from './types';
import { v4 as uuidv4 } from 'uuid';

export const mockUsers: User[] = [
  {
    telegramId: 'seller_123',
    name: 'Тимофей Сергеевич',
    role: 'Продавец',
    position: 'Менеджер по продажам'
  },
  {
    telegramId: 'printer_456',
    name: 'Алексей Сидоров',
    role: 'Принтовщик',
    position: 'Оператор печати'
  },
  {
    telegramId: 'admin_789',
    name: 'Екатерина Великая',
    role: 'Администратор',
    position: 'Руководитель'
  }
];

export const mockOrders: Order[] = [
  {
    id: uuidv4(),
    orderDate: new Date('2023-10-26T10:00:00Z'),
    orderNumber: 'ORD-001',
    shipmentNumber: 'SHP-A1B2',
    status: 'Исполнен',
    productType: 'фб',
    size: 'M',
    seller: 'seller_123',
    price: 1500,
    cost: 750,
    photos: ['https://placehold.co/100x100.png'],
    comment: 'Срочный заказ',
  },
  {
    id: uuidv4(),
    orderDate: new Date('2023-10-27T11:30:00Z'),
    orderNumber: 'ORD-002',
    shipmentNumber: 'SHP-C3D4',
    status: 'Отправлен',
    productType: 'фч',
    size: 'L',
    seller: 'printer_456',
    price: 2200,
    cost: 1100,
    photos: [
      'https://placehold.co/100x100.png',
      'https://placehold.co/100x100.png',
    ],
  },
  {
    id: uuidv4(),
    orderDate: new Date('2023-10-28T09:15:00Z'),
    orderNumber: 'ORD-003',
    shipmentNumber: 'SHP-E5F6',
    status: 'Готов',
    productType: 'хч',
    size: 'S',
    seller: 'admin_789',
    price: 950,
    cost: 400,
    photos: [],
  },
  {
    id: uuidv4(),
    orderDate: new Date('2023-10-29T14:00:00Z'),
    orderNumber: 'ORD-004',
    status: 'Добавлен',
    productType: 'хб',
    size: 'XL',
    seller: 'seller_123',
    price: 3000,
    cost: 1500,
    photos: [
      'https://placehold.co/100x100.png',
      'https://placehold.co/100x100.png',
      'https://placehold.co/100x100.png',
    ],
    comment: 'Подарочная упаковка',
  },
  {
    id: uuidv4(),
    orderDate: new Date('2023-10-25T16:45:00Z'),
    orderNumber: 'ORD-005',
    shipmentNumber: 'SHP-G7H8',
    status: 'Отменен',
    productType: 'хс',
    size: 'M',
    seller: 'printer_456',
    price: 1800,
    cost: 900,
    photos: ['https://placehold.co/100x100.png'],
  },
    {
    id: uuidv4(),
    orderDate: new Date('2023-10-30T10:00:00Z'),
    orderNumber: 'ORD-006',
    shipmentNumber: 'SHP-I9J0',
    status: 'Исполнен',
    productType: 'шч',
    size: 'L',
    seller: 'seller_123',
    price: 2500,
    cost: 1250,
    photos: ['https://placehold.co/100x100.png'],
  },
  {
    id: uuidv4(),
    orderDate: new Date('2023-10-31T11:30:00Z'),
    orderNumber: 'ORD-007',
    status: 'Добавлен',
    productType: 'лб',
    size: 'S',
    seller: 'admin_789',
    price: 1200,
    cost: 600,
    photos: [],
  },
  {
    id: uuidv4(),
    orderDate: new Date('2023-11-01T09:15:00Z'),
    orderNumber: 'ORD-008',
    shipmentNumber: 'SHP-K1L2',
    status: 'Возврат',
    productType: 'лч',
    size: 'M',
    seller: 'printer_456',
    price: 1650,
    cost: 825,
    photos: ['https://placehold.co/100x100.png'],
    comment: 'Клиент просит связаться перед доставкой',
  },
];

export const mockExpenses: Expense[] = [
  {
    id: uuidv4(),
    date: new Date('2023-10-25T10:00:00Z'),
    amount: 5000,
    category: 'Аренда',
    responsible: 'admin_789',
    comment: 'Аренда офиса за Октябрь'
  },
  {
    id: uuidv4(),
    date: new Date('2023-10-26T12:00:00Z'),
    amount: 1200,
    category: 'Расходники',
    responsible: 'printer_456',
    comment: 'Закупка новой партии футболок'
  },
  {
    id: uuidv4(),
    date: new Date('2023-10-27T15:00:00Z'),
    amount: 3500,
    category: 'Маркетинг',
    responsible: 'seller_123',
    comment: 'Рекламная кампания в Telegram'
  },
]
