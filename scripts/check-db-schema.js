const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('--- Checking DB Rows for Branch ID & Staff ID ---');

  const { data: sess } = await supabase.from('whatsapp_sessions').select('*').limit(5);
  console.log('whatsapp_sessions:', sess);

  const { data: staff } = await supabase.from('staff').select('*').limit(5);
  console.log('staff:', staff);

  const { data: members } = await supabase.from('members').select('id, branch_id').not('branch_id', 'is', null).limit(5);
  console.log('members with branch_id:', members);

  const { data: existingEvents } = await supabase.from('events').select('*').limit(5);
  console.log('existing events:', existingEvents);
}

checkSchema();
