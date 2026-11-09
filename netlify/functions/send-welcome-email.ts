/**
 * POST /.netlify/functions/send-welcome-email
 *
 * Body: { "email": "family@example.com" }
 *
 * Sends the welcome email through the Resend API. Called by the sign-up pages after an account is created.
 * Replaces the Supabase edge function send-registration-email, which is no longer called.
 *
 * Environment:
 *   RESEND_API_KEY     — Resend API key with sending access
 *   RESEND_FROM_EMAIL  — optional sender on the verified domain (default andrew@silvertechdirectory.com)
 *
 * Duplicate sends: each request carries an idempotency key built from the address and the UTC day, so a repeated
 * request on the same day does not send a second email.
 */
import type { Handler } from '@netlify/functions';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_BODY_CHARS = 1000;
const MAX_EMAIL_CHARS = 254;

const welcomeHtml = `
  <html>
    <body>
      <h1>Welcome to SilverTech Directory!</h1>
      <p>Thank you for signing up. We're excited to have you on board.</p>
      <p>You can now log in to your account.</p>
      <a href="https://silvertechdirectory.com/login">Login Now</a>
    </body>
  </html>
`;

const welcomeText = `Welcome to SilverTech Directory!
Thank you for signing up. We're excited to have you on board.
You can now log in to your account by visiting https://silvertechdirectory.com/login`;

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }
  if ((event.body || '').length > MAX_BODY_CHARS) {
    return { statusCode: 413, body: JSON.stringify({ error: 'Request too large' }) };
  }

  let email = '';
  try {
    email = String(JSON.parse(event.body || '{}').email || '').trim();
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }
  if (!email || email.length > MAX_EMAIL_CHARS || !EMAIL_PATTERN.test(email)) {
    return { statusCode: 400, body: JSON.stringify({ error: 'A valid email is required' }) };
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  if (!resendApiKey) {
    console.error('RESEND_API_KEY not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Email service not configured' }) };
  }

  const today = new Date().toISOString().slice(0, 10);
  const from = process.env.RESEND_FROM_EMAIL || 'andrew@silvertechdirectory.com';

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${resendApiKey}`,
        'idempotency-key': `welcome-email/${email.toLowerCase()}/${today}`,
      },
      body: JSON.stringify({
        from: `SilverTech Directory <${from}>`,
        to: [email],
        subject: 'Welcome to SilverTech Directory!',
        html: welcomeHtml,
        text: welcomeText,
        tags: [{ name: 'category', value: 'welcome' }],
      }),
    });

    if (!res.ok) {
      console.error('Resend error:', res.status, await res.text());
      return { statusCode: 502, body: JSON.stringify({ error: 'Failed to send email' }) };
    }
    const sent = (await res.json()) as { id?: string };
    return { statusCode: 200, body: JSON.stringify({ message: 'Welcome email sent.', id: sent.id || null }) };
  } catch (err) {
    console.error('Welcome email failed:', err);
    return { statusCode: 502, body: JSON.stringify({ error: 'Email service unavailable' }) };
  }
};
