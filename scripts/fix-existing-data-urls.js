const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixExistingDataUrls() {
  const { data: events, error } = await supabase.from('events').select('*');
  if (error) {
    console.error('Error fetching events:', error);
    return;
  }

  for (const ev of events) {
    let flyerUrl = ev.banner_url || '';
    if (flyerUrl.startsWith('data:image/')) {
      console.log(`Found Data URL for event "${ev.title}" (ID: ${ev.id})`);
      
      const base64Data = flyerUrl.split(',')[1];
      const mimeType = flyerUrl.split(';')[0].split(':')[1] || 'image/png';
      const ext = mimeType.split('/')[1] || 'png';
      const buffer = Buffer.from(base64Data, 'base64');
      const fileName = `event_${Date.now()}_${Math.random().toString(36).substring(7)}.${ext}`;
      const filePath = `EventFlyers/${fileName}`;

      const Blob = globalThis.Blob;
      const FormData = globalThis.FormData;
      const blob = new Blob([buffer], { type: mimeType });
      const formData = new FormData();
      formData.append('file', blob, fileName);

      try {
        const res = await fetch('http://localhost:3000/api/events/upload', {
          method: 'POST',
          body: formData
        });
        const json = await res.json();
        console.log('Upload response:', json);
        if (json.publicUrl) {
          const publicUrl = json.publicUrl;
          console.log(`Uploaded to public URL: ${publicUrl}`);

          let cleanDesc = ev.description || '';
          cleanDesc = cleanDesc.replace(/\[FLYER:\s*[^\]]+\]/g, '').trim();
          const scriptureMatch = cleanDesc.match(/\[SCRIPTURE:\s*([^\]]+)\]/);
          const scriptText = scriptureMatch ? scriptureMatch[1].trim() : (ev.scripture || '');

          let compositeDesc = cleanDesc.replace(/\[SCRIPTURE:\s*[^\]]+\]/g, '').trim();
          compositeDesc += `\n[FLYER:${publicUrl}]`;
          if (scriptText) compositeDesc += `\n[SCRIPTURE:${scriptText}]`;

          const { error: updateError } = await supabase
            .from('events')
            .update({
              banner_url: publicUrl,
              description: compositeDesc.trim()
            })
            .eq('id', ev.id);

          if (updateError) {
            console.error('Update failed:', updateError);
          } else {
            console.log(`Successfully updated event "${ev.title}" in DB with public HTTPS flyer URL!`);
          }
        }
      } catch (err) {
        console.error('Upload error:', err);
      }
    }
  }
}

fixExistingDataUrls();
