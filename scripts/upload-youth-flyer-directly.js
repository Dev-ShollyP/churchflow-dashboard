const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDIxNTQyOSwiZXhwIjoyMDU1NzkxNDI5fQ.12tIeRsm_Vj6bJb9WfT4-v-YJvhXwPZkI9R9rJ1f4Z4';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function uploadYouthFlyerDirectly() {
  const imagePath = 'C:/Users/Olushola/.gemini/antigravity/brain/2683f1cb-7a73-4c77-9501-dfed6e343bfe/.user_uploaded/media_1786563669542.jpg';
  
  if (!fs.existsSync(imagePath)) {
    console.error('Image file not found at:', imagePath);
    return;
  }

  const fileBuffer = fs.readFileSync(imagePath);
  const filePath = `EventFlyers/youth_sunday_mountains_${Date.now()}.jpg`;

  console.log(`Uploading red "Mountains Be Removed" graphic (${fileBuffer.length} bytes) to Supabase Storage with Admin Service Role Key...`);

  const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    .from('Flyers')
    .upload(filePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: true
    });

  let publicUrl = '';
  if (uploadError) {
    console.warn('Supabase storage upload error:', uploadError.message || uploadError);
    // Fallback to Next.js API flyer proxy URL which serves binary image stream directly
    publicUrl = `https://churchflow-dashboard.vercel.app/api/events/flyer?id=8161e678-0a2e-4b7a-99e6-601d361e384b`;
  } else {
    const { data: urlData } = supabaseAdmin.storage.from('Flyers').getPublicUrl(filePath);
    publicUrl = urlData.publicUrl;
  }

  console.log('Final Public HTTPS URL:', publicUrl);

  const { data: events } = await supabaseAdmin.from('events').select('*');
  const youthEv = events.find(e => e.title && e.title.toLowerCase().includes('youth'));

  if (youthEv) {
    const cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";

    const { error: dbErr } = await supabaseAdmin
      .from('events')
      .update({
        banner_url: publicUrl,
        description: cleanDesc
      })
      .eq('id', youthEv.id);

    if (!dbErr) {
      console.log('✅ Successfully updated Youth Sunday event in DB! banner_url set to real HTTPS URL:', publicUrl);
    } else {
      console.error('DB Update Error:', dbErr);
    }
  }
}

uploadYouthFlyerDirectly();
