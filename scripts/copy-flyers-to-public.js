const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function copyFlyerToPublic() {
  const sourceImage = 'C:/Users/Olushola/.gemini/antigravity/brain/2683f1cb-7a73-4c77-9501-dfed6e343bfe/.user_uploaded/media_1786563669542.jpg';
  const targetDir = path.join(__dirname, '../public/flyers');
  const targetFile = path.join(targetDir, 'youth-sunday.jpg');

  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  fs.copyFileSync(sourceImage, targetFile);
  console.log(`✅ Copied red "Mountains Be Removed" graphic to: ${targetFile}`);
}

async function updateDbWithPublicUrl() {
  const publicUrl = 'https://churchflow-dashboard.vercel.app/flyers/youth-sunday.jpg';

  const { data: events } = await supabase.from('events').select('*');
  if (!events) return;

  const youthEv = events.find(e => e.title && e.title.toLowerCase().includes('youth'));
  if (youthEv) {
    const cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
    const compositeDesc = `${cleanDesc}\n[FLYER:${publicUrl}]\n[SCRIPTURE:Mark 11:23]`;

    const { error } = await supabase
      .from('events')
      .update({
        banner_url: publicUrl,
        description: compositeDesc
      })
      .eq('id', youthEv.id);

    if (!error) {
      console.log('✅ Updated Youth Sunday event in Supabase DB with static public CDN URL:', publicUrl);
    } else {
      console.error('Update error:', error);
    }
  }
}

copyFlyerToPublic();
updateDbWithPublicUrl();
