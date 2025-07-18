import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';
import { DebtSchema } from '@/lib/types';

export async function GET() {
  try {
    // For now, just return empty array to avoid database issues
    return NextResponse.json([]);
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