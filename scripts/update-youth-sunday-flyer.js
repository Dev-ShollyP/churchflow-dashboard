const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateYouthSunday() {
  const flyerUrl = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/First%20Service.jpg';
  
  const { data, error } = await supabase
    .from('events')
    .update({
      banner_url: flyerUrl,
      description: "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.\n[FLYER:" + flyerUrl + "]\n[SCRIPTURE:Mark 11:23]"
    })
    .eq('event_date', '2026-08-16');

  console.log('Updated Youth Sunday event in Supabase DB:', data, error);
}

updateYouthSunday();
