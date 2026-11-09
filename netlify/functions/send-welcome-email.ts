/**
 * POST /.netlify/functions/send-welcome-email
 * Header: Authorization: Bearer <the signed-in family account's access token>
 *
 * Sends the welcome email to the address that belongs to that token's account. The browser does not supply the
 * address, and the request body is ignored.
 *
 * Who is allowed:
 *   - the token is valid, checked with Supabase Auth (anon key only; no service-role key is used here)
 *   - the account's email is confirmed
 *   - the account was created within WELCOME_WINDOW_DAYS
 *
 * Duplicates:
 *   - a permanent record per account in Netlify Blobs, shared by every server instance
 *   - a Resend idempotency key per account, which covers concurrent requests
 *
 * Abuse: a per-IP limit on requests per hour. Requests without a valid session are refused before any send.
 *
 * Environment:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY  (already set for the site)
 *   RESEND_API_KEY                             (sending access)
 *   RESEND_FROM_EMAIL                          optional sender on the verified domain
 */
import type { Handler } from '@netlify/functions';
import { getStore } from '@netlify/blobs';

const WELCOME_WINDOW_DAYS = 7;
const MAX_REQUESTS_PER_IP_PER_HOUR = 20;

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

const json = (statusCode: number, body: Record<string, unknown>) => ({
  statusCode,
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify(body),
});

type SupabaseUser = {
  id: string;
  email?: string;
  created_at?: string;
  email_confirmed_at?: string | null;
};

// Asks Supabase Auth who the token belongs to. Returns null for any token it does not accept.
const userForToken = async (accessToken: string, supabaseUrl: string, anonKey: string): Promise<SupabaseUser | null> => {
  const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
    headers: { apikey: anonKey, authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as SupabaseUser;
  return user && user.id && user.email ? user : null;
};

// Counts requests per client address per hour. A rough limit, which is enough to stop a flood from one source.
const withinIpLimit = async (store: ReturnType<typeof getStore>, ip: string): Promise<boolean> => {
  const hour = new Date().toISOString().slice(0, 13);
  const key = `ip/${ip}/${hour}`;
  const current = Number((await store.get(key)) || 0);
  if (current >= MAX_REQUESTS_PER_IP_PER_HOUR) return false;
  await store.set(key, String(current + 1));
  return true;
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!supabaseUrl || !anonKey || !resendApiKey) {
    console.error('Welcome email is not configured');
    return json(500, { error: 'Email service not configured' });
  }

  const store = getStore({ name: 'welcome-emails', consistency: 'strong' });

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
  if (!(await withinIpLimit(store, ip))) {
    return json(429, { error: 'Too many requests' });
  }

  const header = event.headers.authorization || event.headers.Authorization || '';
  const accessToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!accessToken) {
    return json(401, { error: 'Sign in to receive this email' });
  }

  let user: SupabaseUser | null;
  try {
    user = await userForToken(accessToken, supabaseUrl, anonKey);
  } catch (err) {
    console.error('Could not check the session:', err);
    return json(502, { error: 'Could not check the session' });
  }
  if (!user) {
    return json(401, { error: 'Sign in to receive this email' });
  }

  if (!user.email_confirmed_at) {
    return json(403, { error: 'Confirm your email first' });
  }
  const createdAt = Date.parse(user.created_at || '');
  const windowStart = Date.now() - WELCOME_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  if (!Number.isFinite(createdAt) || createdAt < windowStart) {
    return json(403, { error: 'This account is not eligible for a welcome email' });
  }

  const recordKey = `account/${user.id}`;
  if (await store.get(recordKey)) {
    return json(200, { status: 'already_sent' });
  }

  const from = process.env.RESEND_FROM_EMAIL || 'andrew@silvertechdirectory.com';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${resendApiKey}`,
        'idempotency-key': `welcome/${user.id}`,
      },
      body: JSON.stringify({
        from: `SilverTech Directory <${from}>`,
        to: [user.email],
        subject: 'Welcome to SilverTech Directory!',
        html: welcomeHtml,
        text: welcomeText,
        tags: [{ name: 'category', value: 'welcome' }],
      }),
    });

    if (!res.ok) {
      console.error('Resend error:', res.status, await res.text());
      return json(502, { error: 'Failed to send email' });
    }
    const sent = (await res.json()) as { id?: string };
    await store.setJSON(recordKey, { sentAt: new Date().toISOString(), resendId: sent.id || null });
    return json(200, { status: 'sent', id: sent.id || null });
  } catch (err) {
    console.error('Welcome email failed:', err);
    return json(502, { error: 'Email service unavailable' });
  }
};
