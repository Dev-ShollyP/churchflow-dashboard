const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDIxNTQyOSwiZXhwIjoyMDU1NzkxNDI5fQ.12tIeRsm_Vj6bJb9WfT4-v-YJvhXwPZkI9R9rJ1f4Z4';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadYouthSundayFlyer() {
  const imagePath = 'C:/Users/Olushola/.gemini/antigravity/brain/2683f1cb-7a73-4c77-9501-dfed6e343bfe/.user_uploaded/media_1786563669542.jpg';
  const fileBuffer = fs.readFileSync(imagePath);

  const filePath = 'EventFlyers/youth_sunday_mountains_final.jpg';

  console.log('Uploading image to Supabase Storage "Flyers" bucket with Service Role Key...');

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('Flyers')
    .upload(filePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  if (uploadError) {
    console.error('Storage upload error:', uploadError);
    return;
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from('Flyers')
    .getPublicUrl(filePath);

  const publicUrl = publicUrlData.publicUrl;
  console.log('🎉 UPLOAD SUCCESSFUL!');
  console.log('Public Storage URL:', publicUrl);

  // Verify public URL fetch returns HTTP 200
  const checkRes = await fetch(publicUrl);
  console.log('HTTP Status Verification:', checkRes.status);
  console.log('Content-Type Verification:', checkRes.headers.get('content-type'));

  if (checkRes.status === 200) {
    // Update Youth Sunday event in Supabase DB
    const { data: events } = await supabaseAdmin.from('events').select('*');
    const youthEv = events.find(e => e.title && e.title.toLowerCase().includes('youth'));

    if (youthEv) {
      const cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
      const compositeDesc = `${cleanDesc}\n[FLYER:${publicUrl}]\n[SCRIPTURE:Mark 11:23]`;

      const { error: updateErr } = await supabaseAdmin
        .from('events')
        .update({
          banner_url: publicUrl,
          description: compositeDesc
        })
        .eq('id', youthEv.id);

      if (!updateErr) {
        console.log('✅ Successfully updated Youth Sunday event in Supabase DB with direct public flyer URL:', publicUrl);
      } else {
        console.error('DB Update Error:', updateErr);
      }
    }
  }
}

uploadYouthSundayFlyer();
