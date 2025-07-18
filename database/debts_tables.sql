-- Создание таблицы долгов
CREATE TABLE IF NOT EXISTS debts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    person_name VARCHAR(255) NOT NULL,
    base_amount DECIMAL(15,2) NOT NULL CHECK (base_amount > 0),
    current_amount DECIMAL(15,2) NOT NULL DEFAULT 0 CHECK (current_amount >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы погашений долгов
CREATE TABLE IF NOT EXISTS debt_payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    debt_id UUID NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
    amount DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    person_name VARCHAR(255) NOT NULL,
    comment TEXT,
    receipt_photo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации
CREATE INDEX IF NOT EXISTS idx_debts_person_name ON debts(person_name);
CREATE INDEX IF NOT EXISTS idx_debt_payments_debt_id ON debt_payments(debt_id);
CREATE INDEX IF NOT EXISTS idx_debt_payments_created_at ON debt_payments(created_at);

-- Вставка начальных данных для Тимофея и Максима
INSERT INTO debts (person_name, base_amount, current_amount) VALUES
    ('Тимофей', 179957.00, 179957.00),
    ('Максим', 50641.00, 50641.00)
ON CONFLICT (person_name) DO NOTHING;

-- Создание триггера для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_debts_updated_at 
    BEFORE UPDATE ON debts 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 