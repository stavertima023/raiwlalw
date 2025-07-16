import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('Checking table schema...');
    
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not available' }, { status: 503 });
    }

    // Query information_schema to get column information
    const { data, error } = await supabaseAdmin
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'orders')
      .eq('table_schema', 'public');

    if (error) {
      console.error('Schema query error:', error);
      return NextResponse.json({ 
        error: 'Failed to query schema',
        details: error 
      }, { status: 500 });
    }

    console.log('Table schema:', data);
    
    // Also try to get a sample record to see actual field names
    const { data: sampleData, error: sampleError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .limit(1);
    
    if (sampleError) {
      console.error('Sample query error:', sampleError);
    } else {
      console.log('Sample record keys:', sampleData?.[0] ? Object.keys(sampleData[0]) : 'No records');
    }

    return NextResponse.json({
      schema: data,
      sampleKeys: sampleData?.[0] ? Object.keys(sampleData[0]) : null,
      message: 'Schema information retrieved'
    });

  } catch (error: any) {
    console.error('Debug API error:', error);
    return NextResponse.json({ 
      error: 'Unexpected error',
      message: error.message 
    }, { status: 500 });
  }
} 