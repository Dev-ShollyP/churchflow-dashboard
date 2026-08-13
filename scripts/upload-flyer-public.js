const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadPublicFlyer() {
  const imagePath = 'C:/Users/Olushola/.gemini/antigravity/brain/2683f1cb-7a73-4c77-9501-dfed6e343bfe/.user_uploaded/media_1786563669542.jpg';
  const fileBuffer = fs.readFileSync(imagePath);

  const fileName = `EventFlyers/youth_sunday_mountains_final.jpg`;

  console.log('Uploading image buffer (size:', fileBuffer.length, 'bytes) to Supabase Storage bucket "Flyers"...');

  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/Flyers/${fileName}`;
  const res = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'image/jpeg',
      'x-upsert': 'true'
    },
    body: fileBuffer
  });

  console.log('HTTP Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);

  if (res.ok || res.status === 200 || res.status === 201) {
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/Flyers/${fileName}`;
    console.log('🎉 DIRECT PUBLIC STORAGE URL:', publicUrl);

    // Update DB row
    const { data: events } = await supabase.from('events').select('*');
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
        console.log('✅ Updated Youth Sunday event in Supabase DB with direct public flyer URL:', publicUrl);
      }
    }
  }
}

uploadPublicFlyer();
