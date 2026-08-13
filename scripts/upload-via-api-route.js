const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function uploadViaApiRoute() {
  const imagePath = 'C:/Users/Olushola/.gemini/antigravity/brain/2683f1cb-7a73-4c77-9501-dfed6e343bfe/.user_uploaded/media_1786563669542.jpg';
  const fileBuffer = fs.readFileSync(imagePath);

  const blob = new Blob([fileBuffer], { type: 'image/jpeg' });
  const formData = new FormData();
  formData.append('file', blob, 'youth_sunday_mountains.jpg');

  console.log('Sending file to https://churchflow-dashboard.vercel.app/api/events/upload...');

  try {
    const res = await fetch('https://churchflow-dashboard.vercel.app/api/events/upload', {
      method: 'POST',
      body: formData
    });

    console.log('HTTP Status:', res.status);
    const data = await res.json();
    console.log('API Upload Response:', data);

    if (data.publicUrl) {
      console.log('🎉 LIVE PUBLIC URL:', data.publicUrl);

      // Verify public URL fetch returns HTTP 200
      const checkRes = await fetch(data.publicUrl);
      console.log('HTTP Status Verification:', checkRes.status);
      console.log('Content-Type Verification:', checkRes.headers.get('content-type'));

      if (checkRes.status === 200) {
        // Update Youth Sunday event in Supabase DB
        const { data: events } = await supabase.from('events').select('*');
        const youthEv = events.find(e => e.title && e.title.toLowerCase().includes('youth'));

        if (youthEv) {
          const cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
          const compositeDesc = `${cleanDesc}\n[FLYER:${data.publicUrl}]\n[SCRIPTURE:Mark 11:23]`;

          const { error: updateErr } = await supabase
            .from('events')
            .update({
              banner_url: data.publicUrl,
              description: compositeDesc
            })
            .eq('id', youthEv.id);

          if (!updateErr) {
            console.log('✅ Successfully updated Youth Sunday event in DB with direct public flyer URL:', data.publicUrl);
          } else {
            console.error('DB Update Error:', updateErr);
          }
        }
      }
    }
  } catch (err) {
    console.error('Upload Error:', err);
  }
}

uploadViaApiRoute();
