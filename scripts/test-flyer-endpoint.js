async function testFlyerEndpoint() {
  const url = 'https://churchflow-dashboard.vercel.app/api/events/flyer?id=8161e678-0a2e-4b7a-99e6-601d361e384b';
  try {
    const res = await fetch(url);
    console.log('HTTP Status:', res.status);
    console.log('Content-Type:', res.headers.get('content-type'));
    const buffer = await res.arrayBuffer();
    console.log('Received Binary Image Bytes:', buffer.byteLength);
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testFlyerEndpoint();
