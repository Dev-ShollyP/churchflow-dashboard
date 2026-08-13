async function testExistingFlyer() {
  const url = 'https://xzyrftzhaolovlbnpbpk.supabase.co/storage/v1/object/public/Flyers/Service/1785622948992_khbiq.jpg';
  try {
    const res = await fetch(url);
    console.log('HTTP Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const buffer = await res.arrayBuffer();
    console.log('Received Bytes:', buffer.byteLength);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testExistingFlyer();
