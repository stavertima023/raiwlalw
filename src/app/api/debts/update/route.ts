import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    // Получаем все расходы (все записываются на Тимофея)
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('amount');

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Получаем все платежи по долгу Тимофея
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('debt_payments')
      .select('amount')
      .eq('person_name', 'Тимофей');

    if (paymentsError && paymentsError.code !== 'PGRST116') {
      console.error('Error fetching payments:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    // Суммируем все расходы
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Суммируем все платежи
    const totalPayments = payments ? payments.reduce((sum, payment) => sum + payment.amount, 0) : 0;
    
    // Текущий долг = расходы - платежи
    const currentDebt = totalExpenses - totalPayments;

    console.log('Calculated current debt for Тимофей:', {
      totalExpenses,
      totalPayments,
      currentDebt
    });

    // Проверяем, существует ли уже долг Тимофея
    const { data: existingDebt, error: fetchError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .eq('person_name', 'Тимофей')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching existing debt:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch existing debt' }, { status: 500 });
    }

    if (existingDebt) {
      // Обновляем существующий долг, сохраняя платежи
      const { data: updatedDebt, error: updateError } = await supabaseAdmin
        .from('debts')
        .update({
          current_amount: currentDebt,
          updated_at: new Date().toISOString()
        })
        .eq('person_name', 'Тимофей')
        .select()
        .single();

      if (updateError) {
        console.error('Error updating debt:', updateError);
        return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Debt updated successfully', 
        debt: updatedDebt,
        calculation: { 'Тимофей': currentDebt },
        details: {
          totalExpenses,
          totalPayments,
          currentDebt
        }
      });
    } else {
      // Создаем новый долг
      const { data: newDebt, error: insertError } = await supabaseAdmin
        .from('debts')
        .insert({
          person_name: 'Тимофей',
          current_amount: currentDebt,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (insertError) {
        console.error('Error inserting debt:', insertError);
        return NextResponse.json({ error: 'Failed to insert debt' }, { status: 500 });
      }

      return NextResponse.json({ 
        message: 'Debt created successfully', 
        debt: newDebt,
        calculation: { 'Тимофей': currentDebt },
        details: {
          totalExpenses,
          totalPayments,
          currentDebt
        }
      });
    }
  } catch (error) {
    console.error('Error in debt update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 