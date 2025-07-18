import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function POST() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Check if debts already exist
    const { data: existingDebts, error: fetchError } = await supabaseAdmin
      .from('debts')
      .select('person_name')
      .in('person_name', ['Тимофей', 'Максим']);

    if (fetchError) {
      console.error('Error fetching existing debts:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch existing debts' }, { status: 500 });
    }

    const existingNames = existingDebts?.map(d => d.person_name) || [];
    const debtsToCreate = [];

    if (!existingNames.includes('Тимофей')) {
      debtsToCreate.push({
        person_name: 'Тимофей',
        base_amount: 0,
        current_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (!existingNames.includes('Максим')) {
      debtsToCreate.push({
        person_name: 'Максим',
        base_amount: 0,
        current_amount: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    if (debtsToCreate.length === 0) {
      return NextResponse.json({ message: 'Debts already exist' });
    }

    const { data, error } = await supabaseAdmin
      .from('debts')
      .insert(debtsToCreate)
      .select();

    if (error) {
      console.error('Error creating debts:', error);
      return NextResponse.json({ error: 'Failed to create debts' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Debts initialized successfully',
      data 
    });
  } catch (error) {
    console.error('Error in POST /api/debts/init:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 