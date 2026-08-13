const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testUpload() {
  console.log('--- Testing Supabase Storage Flyers Upload ---');
  const dummyBuffer = Buffer.from('fake image data');
  const fileName = `EventFlyers/test_${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from('Flyers')
    .upload(fileName, dummyBuffer, { contentType: 'image/png', upsert: true });

  console.log('Upload result:', data, 'Error:', error);

  if (!error) {
    const { data: urlData } = supabase.storage.from('Flyers').getPublicUrl(fileName);
    console.log('Public URL:', urlData.publicUrl);
  }
}

testUpload();
