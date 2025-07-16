-- Database schema for OrderFlow Factory

-- Users table
CREATE TABLE public.users (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role public.role NOT NULL,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_username_key UNIQUE (username)
) TABLESPACE pg_default;

-- Orders table  
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  "orderDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  "orderNumber" TEXT NOT NULL,
  "shipmentNumber" TEXT NOT NULL,
  status public.order_status NOT NULL,
  "productType" public.product_type NOT NULL,
  size public.size NOT NULL,
  seller TEXT NOT NULL,
  price NUMERIC NOT NULL,
  cost NUMERIC NULL,
  photos TEXT[] DEFAULT '{}',
  comment TEXT NULL,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_seller_fkey FOREIGN KEY (seller) REFERENCES users (username) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT orders_orderNumber_key UNIQUE ("orderNumber")
) TABLESPACE pg_default;

-- Expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  amount NUMERIC NOT NULL,
  category public.expense_category NOT NULL,
  responsible TEXT NOT NULL,
  comment TEXT NULL,
  "receiptPhoto" TEXT NULL,
  CONSTRAINT expenses_pkey PRIMARY KEY (id),
  CONSTRAINT expenses_responsible_fkey FOREIGN KEY (responsible) REFERENCES users (username) ON UPDATE CASCADE ON DELETE RESTRICT
) TABLESPACE pg_default;

-- Payouts table
CREATE TABLE public.payouts (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  seller TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  "orderNumbers" TEXT[] NOT NULL,
  "orderCount" INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  "processedBy" TEXT NOT NULL,
  comment TEXT NULL,
  CONSTRAINT payouts_pkey PRIMARY KEY (id),
  CONSTRAINT payouts_seller_fkey FOREIGN KEY (seller) REFERENCES users (username) ON UPDATE CASCADE ON DELETE RESTRICT,
  CONSTRAINT payouts_processedBy_fkey FOREIGN KEY ("processedBy") REFERENCES users (username) ON UPDATE CASCADE ON DELETE RESTRICT
) TABLESPACE pg_default;

-- ENUM types
CREATE TYPE public.role AS ENUM ('Продавец', 'Принтовщик', 'Администратор');

CREATE TYPE public.order_status AS ENUM ('Добавлен', 'Готов', 'Отправлен', 'Исполнен', 'Отменен', 'Возврат');

CREATE TYPE public.product_type AS ENUM ('фб', 'фч', 'хч', 'хб', 'хс', 'шч', 'лб', 'лч', 'другое');

CREATE TYPE public.size AS ENUM ('S', 'M', 'L', 'XL');

CREATE TYPE public.expense_category AS ENUM ('Аренда', 'Зарплата', 'Расходники', 'Маркетинг', 'Налоги', 'Транспорт', 'Коммунальные', 'Прочее');

-- Enable Row Level Security (RLS)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Note: These will be bypassed by the service role key used in the backend)
CREATE POLICY "Users can view own data" ON public.users FOR SELECT USING (auth.uid()::text = id::text);
CREATE POLICY "Orders are viewable by everyone" ON public.orders FOR SELECT USING (true);
CREATE POLICY "Expenses are viewable by admins" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Payouts are viewable by admins" ON public.payouts FOR SELECT USING (true); 