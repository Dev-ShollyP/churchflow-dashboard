async function debugFlyerUrl() {
  const url = 'https://churchflow-dashboard.vercel.app/api/events/flyer?id=8161e678-0a2e-4b7a-99e6-601d361e384b';
  console.log('Testing URL:', url);
  try {
    const res = await fetch(url, { redirect: 'manual' });
    console.log('HTTP Status Code:', res.status);
    console.log('Headers:', Object.fromEntries(res.headers.entries()));
    if (res.status === 302 || res.status === 301 || res.status === 307) {
      console.log('Redirect Location:', res.headers.get('location'));
    } else {
      const text = await res.text();
      console.log('Body length:', text.length);
      console.log('Body snippet:', text.slice(0, 300));
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

debugFlyerUrl();
