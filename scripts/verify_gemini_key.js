const fs = require('fs');

(async () => {
  try {
    const envPath = '.env';
    if (!fs.existsSync(envPath)) {
      console.error('ERROR: .env file not found');
      process.exit(2);
    }
    const env = fs.readFileSync(envPath, 'utf8');
    const m = env.match(/^GEMINI_API_KEY=(.*)$/m);
    if (!m) {
      console.error('ERROR: GEMINI_API_KEY not found in .env');
      process.exit(3);
    }
    const key = m[1].trim();
    if (!key) {
      console.error('ERROR: GEMINI_API_KEY is empty');
      process.exit(4);
    }

    const body = { contents: [{ parts: [{ text: 'Hello, world' }] }] };

    console.log('Using GEMINI_API_KEY length:', key.length);

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent?key=${encodeURIComponent(
        key,
      )}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    const text = await res.text();
    console.log('HTTP_STATUS:', res.status);
    console.log('RESPONSE_BODY:');
    console.log(text);

    if (!res.ok) process.exit(5);
    process.exit(0);
  } catch (e) {
    console.error('UNCAUGHT_ERROR:', e && e.stack ? e.stack : e);
    process.exit(6);
  }
})();
