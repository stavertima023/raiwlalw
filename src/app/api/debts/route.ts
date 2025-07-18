import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { DebtSchema } from '@/lib/types';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Get all debts
    const { data: debts, error: debtsError } = await supabaseAdmin
      .from('debts')
      .select('*')
      .order('created_at', { ascending: false });

    if (debtsError) {
      console.error('Error fetching debts:', debtsError);
      return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
    }

    // Get all expenses
    const { data: expenses, error: expensesError } = await supabaseAdmin
      .from('expenses')
      .select('*');

    if (expensesError) {
      console.error('Error fetching expenses:', expensesError);
      return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
    }

    // Get all debt payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from('debt_payments')
      .select('*');

    if (paymentsError) {
      console.error('Error fetching debt payments:', paymentsError);
      return NextResponse.json({ error: 'Failed to fetch debt payments' }, { status: 500 });
    }

    // Get all users for name mapping
    const { data: users, error: usersError } = await supabaseAdmin
      .from('users')
      .select('id, name');

    if (usersError) {
      console.error('Error fetching users:', usersError);
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }

    // Create user name mapping
    const userMap = new Map(users?.map(u => [u.id, u.name]) || []);

    // Calculate current amounts for each debt
    const debtsWithCalculations = (debts || []).map(debt => {
      // Calculate expenses for this person
      const personExpenses = (expenses || []).filter(expense => {
        const responsibleName = userMap.get(expense.responsible);
        return responsibleName === debt.person_name;
      });
      
      const totalExpenses = personExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
      
      // Calculate payments for this debt
      const debtPayments = (payments || []).filter(payment => 
        payment.debt_id === debt.id
      );
      
      const totalPayments = debtPayments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
      
      // Calculate current amount: base + expenses - payments
      const currentAmount = (debt.base_amount || 0) + totalExpenses - totalPayments;
      
      return {
        ...debt,
        current_amount: Math.max(0, currentAmount), // Ensure non-negative
        total_expenses: totalExpenses,
        total_payments: totalPayments
      };
    });

    return NextResponse.json(debtsWithCalculations);
  } catch (error) {
    console.error('Error in GET /api/debts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await request.json();
    const validatedData = DebtSchema.parse(body);

    const { data, error } = await supabaseAdmin
      .from('debts')
      .insert([validatedData])
      .select()
      .single();

    if (error) {
      console.error('Error creating debt:', error);
      return NextResponse.json({ error: 'Failed to create debt' }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in POST /api/debts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 