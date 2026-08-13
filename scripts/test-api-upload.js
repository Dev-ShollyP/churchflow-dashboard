const fs = require('fs');

async function testUpload() {
  // Read a dummy small PNG
  const buffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  
  const Blob = globalThis.Blob;
  const FormData = globalThis.FormData;
  
  const blob = new Blob([buffer], { type: 'image/png' });
  const formData = new FormData();
  formData.append('file', blob, 'test-flyer.png');

  try {
    const res = await fetch('http://localhost:3000/api/events/upload', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    console.log('API Upload Result:', json);
  } catch (err) {
    console.error('Fetch error (server might not be running locally):', err);
  }
}

testUpload();
