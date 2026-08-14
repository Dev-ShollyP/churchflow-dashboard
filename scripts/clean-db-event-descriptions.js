const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanDbEventDescriptions() {
  const { data: events, error } = await supabase.from('events').select('*');
  if (error || !events) {
    console.error('Error fetching events:', error);
    return;
  }

  for (const ev of events) {
    let cleanDesc = (ev.description || '').replace(/\[FLYER:\s*[^\]]+\]/gi, '').trim();
    let bannerUrl = ev.banner_url || '';

    // If banner_url contains data:image/ or /api/flyers, clean it up to use /api/events/flyer?id=
    if (bannerUrl.startsWith('data:image/') || bannerUrl.includes('/api/flyers/')) {
      bannerUrl = `https://churchflow-dashboard.vercel.app/api/events/flyer?id=${ev.id}`;
    }

    console.log(`Cleaning event "${ev.title}" (ID: ${ev.id})...`);
    console.log('  Clean Description:', cleanDesc);
    console.log('  Banner URL:', bannerUrl);

    const { error: updateErr } = await supabase
      .from('events')
      .update({
        description: cleanDesc,
        banner_url: bannerUrl
      })
      .eq('id', ev.id);

    if (updateErr) {
      console.error(`Failed to clean event ${ev.id}:`, updateErr);
    } else {
      console.log(`✅ Cleaned event "${ev.title}" in DB!`);
    }
  }
}

cleanDbEventDescriptions();
