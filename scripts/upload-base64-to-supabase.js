const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function convertAllBase64Events() {
  const { data: events, error } = await supabase.from('events').select('*');
  if (error || !events) {
    console.error('Error fetching events:', error);
    return;
  }

  for (const ev of events) {
    const banner = ev.banner_url || '';
    if (banner.startsWith('data:image/')) {
      console.log(`Converting Base64 image for event: "${ev.title}" (ID: ${ev.id})...`);
      
      const parts = banner.split(',');
      const mime = parts[0].split(';')[0].split(':')[1] || 'image/png';
      const ext = mime.split('/')[1] || 'png';
      const buffer = Buffer.from(parts[1], 'base64');
      const fileName = `event_${ev.id}_${Date.now()}.${ext}`;

      // Upload to Flyers bucket using storage REST endpoint
      const uploadUrl = `${SUPABASE_URL}/storage/v1/object/Flyers/EventFlyers/${fileName}`;
      const uploadRes = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': mime,
          'x-upsert': 'true'
        },
        body: buffer
      });

      console.log(`Upload status for ${ev.title}:`, uploadRes.status);
      
      let publicUrl = '';
      if (uploadRes.ok) {
        publicUrl = `${SUPABASE_URL}/storage/v1/object/public/Flyers/EventFlyers/${fileName}`;
      } else {
        // Fallback to our Next.js image endpoint
        publicUrl = `https://churchflow-dashboard.vercel.app/api/flyers/${ev.id}`;
      }

      console.log(`Setting public image URL: ${publicUrl}`);

      let cleanDesc = (ev.description || '').replace(/\[FLYER:\s*[^\]]+\]/g, '').trim();
      const sMatch = cleanDesc.match(/\[SCRIPTURE:\s*([^\]]+)\]/);
      const scriptureRef = sMatch ? sMatch[1].trim() : (ev.scripture || '');

      let compositeDesc = cleanDesc.replace(/\[SCRIPTURE:\s*[^\]]+\]/g, '').trim();
      compositeDesc += `\n[FLYER:${publicUrl}]`;
      if (scriptureRef) compositeDesc += `\n[SCRIPTURE:${scriptureRef}]`;

      const { error: updateErr } = await supabase
        .from('events')
        .update({
          banner_url: publicUrl,
          description: compositeDesc.trim()
        })
        .eq('id', ev.id);

      if (updateErr) {
        console.error(`Failed to update event ${ev.id}:`, updateErr);
      } else {
        console.log(`✅ Successfully updated event "${ev.title}" in DB!`);
      }
    }
  }
}

convertAllBase64Events();
