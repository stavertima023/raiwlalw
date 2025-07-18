import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const body = await request.json();
    
    // Валидация данных
    const { debtId, paymentAmount, comment, processedBy } = body;
    
    if (!debtId || !paymentAmount || !processedBy) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (paymentAmount <= 0) {
      return NextResponse.json({ error: 'Payment amount must be positive' }, { status: 400 });
    }
    
    // Получаем текущий долг
    const { data: currentDebt, error: debtError } = await supabaseAdmin
      .from('debts')
      .select('current_amount')
      .eq('id', debtId)
      .single();

    if (debtError || !currentDebt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    // Проверяем, что сумма погашения не превышает долг
    if (paymentAmount > currentDebt.current_amount) {
      return NextResponse.json({ error: 'Payment amount exceeds debt amount' }, { status: 400 });
    }

    // Вычисляем остаток долга
    const remainingDebt = currentDebt.current_amount - paymentAmount;

    // Создаем запись о погашении
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('debt_payments')
      .insert({
        debt_id: debtId,
        payment_amount: paymentAmount,
        remaining_debt: remainingDebt,
        comment: comment || null,
        processed_by: processedBy,
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
      .eq('id', debtId);

    if (updateError) {
      console.error('Error updating debt:', updateError);
      return NextResponse.json({ error: 'Failed to update debt' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Payment created successfully',
      payment 
    });
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
    const debtId = searchParams.get('debtId');

    let query = supabaseAdmin
      .from('debt_payments')
      .select('*')
      .order('payment_date', { ascending: false });

    if (debtId) {
      query = query.eq('debt_id', debtId);
    }

    const { data: payments, error } = await query;

    if (error) {
      console.error('Error fetching payments:', error);
      return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }

    return NextResponse.json({ payments: payments || [] });
  } catch (error) {
    console.error('Error in GET /api/debts/payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 