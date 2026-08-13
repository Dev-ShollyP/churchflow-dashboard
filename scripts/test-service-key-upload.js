const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
// Service role key bypasses RLS policies
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDIxNTQyOSwiZXhwIjoyMDU1NzkxNDI5fQ.12tIeRsm_Vj6bJb9WfT4-v-YJvhXwPZkI9R9rJ1f4Z4';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false }
});

async function runFix() {
  const { data: events, error } = await supabaseAdmin.from('events').select('*');
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

    const { data: uploadData, error: uploadErr } = await supabaseAdmin.storage
      .from('Flyers')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (uploadErr) {
      console.error('Upload with admin key failed:', uploadErr);
      return;
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('Flyers').getPublicUrl(fileName);
    const publicUrl = publicUrlData.publicUrl;
    console.log('🎉 Generated Public HTTPS URL:', publicUrl);

    let cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
    let compositeDesc = `${cleanDesc}\n[FLYER:${publicUrl}]\n[SCRIPTURE:Mark 11:23]`;

    const { error: updateErr } = await supabaseAdmin
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
  } else {
    console.log('Current banner_url is already a public URL:', currentBanner);
  }
}

runFix();
