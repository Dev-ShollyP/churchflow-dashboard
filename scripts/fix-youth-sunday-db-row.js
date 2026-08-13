const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixYouthSundayInDb() {
  const { data: events, error } = await supabase.from('events').select('*');
  if (error || !events) {
    console.error('Error fetching events:', error);
    return;
  }

  const youthEv = events.find(e => e.title && e.title.toLowerCase().includes('youth'));
  if (!youthEv) {
    console.error('Youth Sunday event not found in DB');
    return;
  }

  console.log('Found Youth Sunday Event ID:', youthEv.id);
  const currentBanner = youthEv.banner_url || '';

  if (currentBanner.startsWith('data:image/')) {
    console.log('Extracting Base64 image data...');
    const base64Data = currentBanner.split(',')[1];
    const mimeType = currentBanner.split(';')[0].split(':')[1] || 'image/jpeg';
    const ext = mimeType.split('/')[1] || 'jpeg';
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `EventFlyers/youth_sunday_mountains_${Date.now()}.${ext}`;

    console.log('Uploading directly to Supabase Storage bucket Flyers via REST...');
    const uploadUrl = `${SUPABASE_URL}/storage/v1/object/Flyers/${fileName}`;
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true'
      },
      body: buffer
    });

    const uploadStatus = uploadRes.status;
    console.log('Upload HTTP status:', uploadStatus);
    const uploadText = await uploadRes.text();
    console.log('Upload response body:', uploadText);

    if (uploadStatus === 200 || uploadStatus === 201) {
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/Flyers/${fileName}`;
      console.log('Generated Public HTTPS URL:', publicUrl);

      let cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
      let compositeDesc = `${cleanDesc}\n[FLYER:${publicUrl}]\n[SCRIPTURE:Mark 11:23]`;

      const { error: updateErr } = await supabase
        .from('events')
        .update({
          banner_url: publicUrl,
          description: compositeDesc
        })
        .eq('id', youthEv.id);

      if (updateErr) {
        console.error('Update DB error:', updateErr);
      } else {
        console.log('🎉 SUCCESS! Youth Sunday row in DB updated to public HTTPS URL:', publicUrl);
      }
    }
  } else {
    console.log('Current banner_url is already a public URL:', currentBanner);
  }
}

fixYouthSundayInDb();
