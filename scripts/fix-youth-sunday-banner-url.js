const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixYouthSundayBannerUrl() {
  const imagePath = 'C:/Users/Olushola/.gemini/antigravity/brain/2683f1cb-7a73-4c77-9501-dfed6e343bfe/.user_uploaded/media_1786563669542.jpg';

  if (!fs.existsSync(imagePath)) {
    console.error('Image file not found at:', imagePath);
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const base64Str = fileBuffer.toString('base64');
  const dataUrl = `data:image/jpeg;base64,${base64Str}`;

  console.log(`Read red "Mountains Be Removed" graphic (${fileBuffer.length} bytes)...`);

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

  const { error: updateErr } = await supabase
    .from('events')
    .update({
      banner_url: dataUrl,
      description: cleanDescription
    })
    .eq('id', youthEv.id);

  if (updateErr) {
    console.error('Failed to update Youth Sunday:', updateErr);
  } else {
    console.log('🎉 SUCCESS! Youth Sunday updated: banner_url set to red "Mountains Be Removed" Data URL, description set to 100% clean text!');
  }
}

fixYouthSundayBannerUrl();
