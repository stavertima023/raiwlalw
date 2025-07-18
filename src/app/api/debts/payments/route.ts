import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { DebtPaymentSchema } from '@/lib/types';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const { data: payments, error } = await supabaseAdmin
      .from('debt_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching debt payments:', error);
      return NextResponse.json({ error: 'Failed to fetch debt payments' }, { status: 500 });
    }

    return NextResponse.json(payments || []);
  } catch (error) {
    console.error('Error in GET /api/debts/payments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const validatedData = DebtPaymentSchema.parse(body);

    // Convert field names for database compatibility
    const paymentData = {
      debt_id: validatedData.debtId,
      amount: validatedData.amount,
      person_name: validatedData.personName,
      comment: validatedData.comment,
      receipt_photo: validatedData.receiptPhoto,
      created_at: new Date().toISOString()
    };

    // Start a transaction
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('debt_payments')
      .insert([paymentData])
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating debt payment:', paymentError);
      return NextResponse.json({ error: 'Failed to create debt payment' }, { status: 500 });
    }

    // Update the debt amount
    const { data: debt, error: debtError } = await supabaseAdmin
      .from('debts')
      .select('current_amount')
      .eq('id', validatedData.debtId)
      .single();

    if (debtError) {
      console.error('Error fetching debt:', debtError);
      return NextResponse.json({ error: 'Failed to fetch debt' }, { status: 500 });
    }

    const newAmount = Math.max(0, debt.current_amount - validatedData.amount);

    const { error: updateError } = await supabaseAdmin
      .from('debts')
      .update({ current_amount: newAmount, updated_at: new Date().toISOString() })
      .eq('id', validatedData.debtId);

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