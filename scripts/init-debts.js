const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function initializeDebts() {
  try {
    console.log('Initializing debts...');

    // Check if debts already exist
    const { data: existingDebts, error: fetchError } = await supabase
      .from('debts')
      .select('person_name')
      .in('person_name', ['Тимофей', 'Максим']);

    if (fetchError) {
      console.error('Error fetching existing debts:', fetchError);
      return;
    }

    const existingNames = existingDebts?.map(d => d.person_name) || [];
    const debtsToCreate = [];

    if (!existingNames.includes('Тимофей')) {
      debtsToCreate.push({
        person_name: 'Тимофей',
        base_amount: 50000,
        current_amount: 50000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('Will create debt for Тимофей');
    }

    if (!existingNames.includes('Максим')) {
      debtsToCreate.push({
        person_name: 'Максим',
        base_amount: 30000,
        current_amount: 30000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
      console.log('Will create debt for Максим');
    }

    if (debtsToCreate.length === 0) {
      console.log('Debts already exist');
      return;
    }

    const { data, error } = await supabase
      .from('debts')
      .insert(debtsToCreate)
      .select();

    if (error) {
      console.error('Error creating debts:', error);
      return;
    }

    console.log('Debts created successfully:', data);
  } catch (error) {
    console.error('Error in initializeDebts:', error);
  }
}

// Run the initialization
initializeDebts(); 