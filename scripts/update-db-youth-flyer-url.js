const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateDbYouthFlyerUrl() {
  const { data: events, error: fetchErr } = await supabase.from('events').select('*');
  if (fetchErr || !events) {
    console.error('Fetch events error:', fetchErr);
    return;
  }

  const youthEv = events.find(e => e.title && e.title.toLowerCase().includes('youth'));
  if (!youthEv) {
    console.error('Youth Sunday event not found in database');
    return;
  }

  console.log('Found Youth Sunday Event ID:', youthEv.id);

  const cleanDescription = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
  const flyerUrl = `https://churchflow-dashboard.vercel.app/api/events/flyer?id=${youthEv.id}`;

  const { error: updateErr } = await supabase
    .from('events')
    .update({
      banner_url: flyerUrl,
      description: cleanDescription
    })
    .eq('id', youthEv.id);

  if (updateErr) {
    console.error('Failed to update Youth Sunday:', updateErr);
  } else {
    console.log('🎉 SUCCESS! Youth Sunday updated: banner_url set to real HTTPS URL:', flyerUrl);
  }
}

updateDbYouthFlyerUrl();
