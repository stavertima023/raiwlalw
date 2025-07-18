import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Admin client not available' }, { status: 500 });
    }

    const { data: debts, error } = await supabaseAdmin
      .from('debts')
      .select('*')
      .order('person_name');

    if (error) {
      console.error('Error fetching debts:', error);
      return NextResponse.json({ error: 'Failed to fetch debts' }, { status: 500 });
    }

    return NextResponse.json(debts || []);
  } catch (error) {
    console.error('Error in GET /api/debts:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 