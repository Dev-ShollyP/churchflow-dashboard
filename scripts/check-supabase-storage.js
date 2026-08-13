const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xzyrftzhaolovlbnpbpk.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6eXJmdHpoYW9sb3ZsYm5wYnBrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1NDk4NDgsImV4cCI6MjEwMDEyNTg0OH0.EpHzchjPGnRoQgaY-zGF9GvyPNcR-JQt9kAL5zosT3I';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testStorageUrls() {
  const urls = [
    'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/First%20Service.jpg',
    'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/Digging%20Deep.png',
    'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/Thanks.jpg'
  ];

  for (const u of urls) {
    try {
      const res = await fetch(u);
      console.log(`URL: ${u}`);
      console.log(`HTTP Status: ${res.status}, Content-Type: ${res.headers.get('content-type')}`);
    } catch (e) {
      console.error('Err:', e);
    }
  }
}

testStorageUrls();
