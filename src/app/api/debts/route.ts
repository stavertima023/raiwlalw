import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Получаем долги из таблицы
    const { data: debts, error } = await supabaseAdmin
      .from('debts')
      .select('*')
      .order('person_name');

    if (error) {
      console.error('Error fetching debts:', error);
      
      // Если таблица не существует, возвращаем временные долги
      if (error.code === 'PGRST116') {
        console.log('Debts table does not exist, calculating from expenses...');
        
        // Получаем все расходы (все записываются на Тимофея)
        const { data: expenses, error: expensesError } = await supabaseAdmin
          .from('expenses')
          .select('amount');

        if (expensesError) {
          console.error('Error fetching expenses:', expensesError);
          return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
        }

        // Суммируем все расходы
        const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
        
        // Пытаемся получить платежи, но не падаем если таблица не существует
        let totalPayments = 0;
        try {
          const { data: payments, error: paymentsError } = await supabaseAdmin
            .from('debt_payments')
            .select('amount')
            .eq('person_name', 'Тимофей');

          if (paymentsError) {
            console.log('Payments table not available, using 0 for payments:', paymentsError.message);
            totalPayments = 0;
          } else {
            totalPayments = payments ? payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
          }
        } catch (error) {
          console.log('Error fetching payments, using 0:', error);
          totalPayments = 0;
        }
        
        // Текущий долг = расходы - платежи
        const currentDebt = totalExpenses - totalPayments;

        // Создаем временные долги для отображения
        const tempDebts = [{
          id: 'temp-Тимофей',
          person_name: 'Тимофей',
          current_amount: currentDebt,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_temporary: true
        }];

        return NextResponse.json(tempDebts);
      }
      
      return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
    }

    return NextResponse.json(debts || []);
  } catch (error) {
    console.error('Error in GET /api/debts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 