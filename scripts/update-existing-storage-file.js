const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function updateExistingStorageFile() {
  const imagePath = 'C:/Users/Olushola/.gemini/antigravity/brain/2683f1cb-7a73-4c77-9501-dfed6e343bfe/.user_uploaded/media_1786563669542.jpg';
  const fileBuffer = fs.readFileSync(imagePath);

  const filePath = 'Service/1785622948992_khbiq.jpg';

  console.log(`Updating existing public file "Flyers/${filePath}" with red "Mountains Be Removed" graphic (${fileBuffer.length} bytes)...`);

  const { data, error } = await supabase.storage
    .from('Flyers')
    .update(filePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  console.log('Update error:', error);
  console.log('Update data:', data);

  const publicUrl = `https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/${filePath}`;
  console.log('Testing Public URL:', publicUrl);

  const res = await fetch(publicUrl);
  console.log('HTTP Status Verification:', res.status);
  console.log('Content-Type Verification:', res.headers.get('content-type'));
  console.log('Content-Length Verification:', res.headers.get('content-length'));

  if (res.status === 200) {
    console.log('🎉 SUCCESS! Updating Youth Sunday in Supabase DB with direct 200 OK Supabase Storage URL...');
    const { data: events } = await supabase.from('events').select('*');
    const youthEv = events.find(e => e.title && e.title.toLowerCase().includes('youth'));

    if (youthEv) {
      const cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
      const compositeDesc = `${cleanDesc}\n[FLYER:${publicUrl}]\n[SCRIPTURE:Mark 11:23]`;

      const { error: dbErr } = await supabase
        .from('events')
        .update({
          banner_url: publicUrl,
          description: compositeDesc
        })
        .eq('id', youthEv.id);

      if (!dbErr) {
        console.log('✅ Successfully updated Youth Sunday event in DB with 100% working Supabase public URL:', publicUrl);
      } else {
        console.error('DB update error:', dbErr);
      }
    }
  }
}

updateExistingStorageFile();
