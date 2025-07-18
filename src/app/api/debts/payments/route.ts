import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { DebtPaymentSchema } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const body = await request.json();
    
    // Валидация данных
    const validatedData = DebtPaymentSchema.parse(body);
    
    // Получаем текущий долг
    const { data: currentDebt, error: debtError } = await supabaseAdmin
      .from('debts')
      .select('current_amount')
      .eq('id', validatedData.debt_id)
      .single();

    if (debtError || !currentDebt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    // Проверяем, что сумма погашения не превышает долг
    if (validatedData.payment_amount > currentDebt.current_amount) {
      return NextResponse.json({ error: 'Payment amount exceeds debt amount' }, { status: 400 });
    }

    // Вычисляем остаток долга
    const remainingDebt = currentDebt.current_amount - validatedData.payment_amount;

    // Создаем запись о погашении
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('debt_payments')
      .insert({
        debt_id: validatedData.debt_id,
        payment_amount: validatedData.payment_amount,
        remaining_debt: remainingDebt,
        receipt_photo: validatedData.receipt_photo,
        comment: validatedData.comment,
        processed_by: validatedData.processed_by,
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment:', paymentError);
      return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }

    // Обновляем сумму долга
    const { error: updateError } = await supabaseAdmin
      .from('debts')
      .update({ current_amount: remainingDebt })
      .eq('id', validatedData.debt_id);

    if (updateError) {
      console.error('Error updating debt:', updateError);
      return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 });
    }

    return NextResponse.json(payment);
  } catch (error) {
    console.error('Error in POST /api/debts/payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const debtId = searchParams.get('debt_id');

    let query = supabaseAdmin
      .from('debt_payments')
      .select(`
        *,
        debts (
          person_name
        )
      `)
      .order('payment_date', { ascending: false });

    if (debtId) {
      query = query.eq('debt_id', debtId);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json(payments || []);
  } catch (error) {
    console.error('Error in GET /api/debts/payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 