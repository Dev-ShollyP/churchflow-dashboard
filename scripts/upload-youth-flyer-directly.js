const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MDIxNTQyOSwiZXhwIjoyMDU1NzkxNDI5fQ.12tIeRsm_Vj6bJb9WfT4-v-YJvhXwPZkI9R9rJ1f4Z4';

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function fixYouthSundayFlyerDirect() {
  const { data: events, error } = await supabaseAdmin.from('events').select('*').ilike('title', '%Youth Sunday%');
  if (error || !events || !events.length) {
    console.error('Error finding Youth Sunday event:', error);
    return;
  }

  const ev = events[0];
  console.log('Found Youth Sunday Event in DB:', ev.id);
  const flyerUrl = ev.banner_url || '';

  if (flyerUrl.startsWith('data:image/')) {
    console.log('Converting base64 Data URL into public Supabase Storage URL...');
    const base64Data = flyerUrl.split(',')[1];
    const mimeType = flyerUrl.split(';')[0].split(':')[1] || 'image/png';
    const ext = mimeType.split('/')[1] || 'png';
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `event_youth_sunday_${Date.now()}.${ext}`;
    const filePath = `EventFlyers/${fileName}`;

    const { error: uploadErr } = await supabaseAdmin.storage
      .from('Flyers')
      .upload(filePath, buffer, { contentType: mimeType, upsert: true });

    if (uploadErr) {
      console.error('Upload to Supabase Storage failed:', uploadErr);
      return;
    }

    const { data: publicUrlData } = supabaseAdmin.storage.from('Flyers').getPublicUrl(filePath);
    const publicUrl = publicUrlData.publicUrl;
    console.log('Public HTTPS URL generated:', publicUrl);

    let cleanDesc = "Prayer Sunday: A powerful Prayer Sunday. It focuses on overcoming life's impossible situations. Through faith, prayer, and God's Word, we confront every mountain standing against progress.";
    let compositeDesc = `${cleanDesc}\n[FLYER:${publicUrl}]\n[SCRIPTURE:Mark 11:23]`;

    const { error: updateErr } = await supabaseAdmin
      .from('events')
      .update({
        banner_url: publicUrl,
        description: compositeDesc
      })
      .eq('id', ev.id);

    if (updateErr) {
      console.error('Failed to update event row:', updateErr);
    } else {
      console.log('🎉 SUCCESS! Youth Sunday DB row updated with public HTTPS flyer URL:', publicUrl);
    }
  } else {
    console.log('Current banner_url is already a URL:', flyerUrl);
  }
}

fixYouthSundayFlyerDirect();
