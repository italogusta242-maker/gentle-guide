import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://hyjpxscsixeoibzhhtaf.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5anB4c2NzaXhlb2liemhodGFmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mzc3MTk3MiwiZXhwIjoyMDg5MzQ3OTcyfQ.mTineL1IKkuKua2hIfrQo4TuCjNzcWC31rx1NEGyXtI';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkTables() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .limit(1);

  if (error) {
    console.error('ERRO ao acessar profiles:', error.message);
  } else {
    console.log('Sucesso ao acessar profiles. Dados:', data);
  }

  // List schemas/tables via RPC if possible, or just check another table
  const { error: error2 } = await supabase
    .from('user_roles')
    .select('id')
    .limit(1);
    
  if (error2) {
    console.error('ERRO ao acessar user_roles:', error2.message);
  } else {
    console.log('Sucesso ao acessar user_roles.');
  }
}

checkTables();
