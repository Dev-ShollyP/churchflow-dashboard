const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU0OTg0OCwiZXhwIjoyMDAwMTI1ODQ4fQ.5jVnF01y87q7-E6W5Q7cQ_g8f0Jp_4L0Q_QZ_0-Q_00'; // Service key from n8n workflow

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testServiceKeyUpload() {
  console.log('--- Testing Service Key Storage Flyers Upload ---');
  const dummyBuffer = Buffer.from('fake image data');
  const fileName = `EventFlyers/test_service_${Date.now()}.png`;

  const { data, error } = await supabase.storage
    .from('Flyers')
    .upload(fileName, dummyBuffer, { contentType: 'image/png', upsert: true });

  console.log('Upload result:', data, 'Error:', error);

  if (!error) {
    const { data: urlData } = supabase.storage.from('Flyers').getPublicUrl(fileName);
    console.log('Public URL:', urlData.publicUrl);
  }
}

testServiceKeyUpload();
