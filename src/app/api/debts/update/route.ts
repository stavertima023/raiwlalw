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

    // Все долги записываются только на Тимофея
    const totalAmount = expenses.reduce((sum, expense) => sum + expense.amount, 0);

    console.log('Calculated total debt for Тимофей:', totalAmount);

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
          current_amount: totalAmount,
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
        calculation: { 'Тимофей': totalAmount }
      });
    } else {
      // Создаем новый долг
      const { data: newDebt, error: insertError } = await supabaseAdmin
        .from('debts')
        .insert({
          person_name: 'Тимофей',
          current_amount: totalAmount,
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
        calculation: { 'Тимофей': totalAmount }
      });
    }
  } catch (error) {
    console.error('Error in debt update:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 