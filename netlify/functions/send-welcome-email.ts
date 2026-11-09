/**
 * POST /.netlify/functions/send-welcome-email
 * Header: Authorization: Bearer <the signed-in family account's access token>
 *
 * Sends the welcome email to the address on that token's account. The browser does not supply the address, and the
 * request body is ignored.
 *
 * Authority:
 *   - Identity comes from Supabase Auth, checked with the token and the public anon key.
 *   - The record of a sent welcome email is the database table welcome_email_sends, keyed by user id with a primary
 *     key. Only this function writes to it, with the server-only service-role key. Users cannot change it: no
 *     client role has write access to it. Account metadata is never read or written for this.
 *   - The per-client-address limit is the database table welcome_rate_limits, incremented atomically. It is shared by
 *     every server instance and survives restarts. Client addresses are stored as hashes.
 *
 * Who is allowed: a valid session, a confirmed email, and an account created within WELCOME_WINDOW_DAYS.
 *
 * Environment:
 *   VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY   (already set)
 *   SUPABASE_SERVICE_ROLE_KEY                   server-only. Never sent to a browser.
 *   RESEND_API_KEY                              sending access
 *   RESEND_FROM_EMAIL                           optional sender on the verified domain
 *   RATE_LIMIT_SALT                             optional; hashes client addresses
 */
import type { Handler } from '@netlify/functions';
import { createHash } from 'crypto';

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

type Env = { supabaseUrl: string; anonKey: string; serviceKey: string };

// Asks Supabase Auth who the token belongs to. Returns null for any token it does not accept.
const userForToken = async (accessToken: string, env: Env): Promise<SupabaseUser | null> => {
  const res = await fetch(`${env.supabaseUrl}/auth/v1/user`, {
    headers: { apikey: env.anonKey, authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return null;
  const user = (await res.json()) as SupabaseUser;
  return user && user.id && user.email ? user : null;
};

// Server-side REST call with the service-role key. Used only for the two welcome tables.
const serviceRest = (env: Env, path: string, init: RequestInit = {}) =>
  fetch(`${env.supabaseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: env.serviceKey,
      authorization: `Bearer ${env.serviceKey}`,
      'content-type': 'application/json',
      ...(init.headers as Record<string, string> | undefined),
    },
  });

// Atomically counts a request for this client-address hash in this hour. Returns false once the limit is reached.
const withinIpLimit = async (env: Env, ip: string): Promise<boolean> => {
  const salt = process.env.RATE_LIMIT_SALT || 'silvertech-welcome';
  const hash = createHash('sha256').update(`${salt}:${ip}`).digest('hex');
  const hour = new Date().toISOString().slice(0, 13);
  const res = await serviceRest(env, 'rpc/welcome_rate_hit', {
    method: 'POST',
    body: JSON.stringify({ p_key: `${hash}:${hour}`, p_limit: MAX_REQUESTS_PER_IP_PER_HOUR }),
  });
  if (!res.ok) throw new Error(`rate limit check failed (${res.status})`);
  return (await res.json()) === true;
};

// Claims the one welcome email for this account. The primary key allows exactly one claim, however many requests
// or server instances race. Returns true only for the request that made the claim.
const claimWelcome = async (env: Env, userId: string): Promise<boolean> => {
  const res = await serviceRest(env, 'welcome_email_sends', {
    method: 'POST',
    headers: { prefer: 'resolution=ignore-duplicates,return=representation' },
    body: JSON.stringify({ user_id: userId }),
  });
  if (!res.ok) throw new Error(`claim failed (${res.status})`);
  const rows = (await res.json()) as unknown[];
  return Array.isArray(rows) && rows.length === 1;
};

const releaseClaim = async (env: Env, userId: string) => {
  await serviceRest(env, `welcome_email_sends?user_id=eq.${encodeURIComponent(userId)}`, { method: 'DELETE' });
};

const markSent = async (env: Env, userId: string, resendId: string | null) => {
  await serviceRest(env, `welcome_email_sends?user_id=eq.${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: { prefer: 'return=minimal' },
    body: JSON.stringify({ sent_at: new Date().toISOString(), resend_id: resendId }),
  });
};

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const env: Env = {
    supabaseUrl: process.env.VITE_SUPABASE_URL || '',
    anonKey: process.env.VITE_SUPABASE_ANON_KEY || '',
    serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  };
  const resendApiKey = process.env.RESEND_API_KEY;
  if (!env.supabaseUrl || !env.anonKey || !env.serviceKey || !resendApiKey) {
    console.error('Welcome email is not configured');
    return json(500, { error: 'Email service not configured' });
  }

  const ip = event.headers['x-nf-client-connection-ip'] || event.headers['client-ip'] || 'unknown';
  try {
    if (!(await withinIpLimit(env, ip))) {
      return json(429, { error: 'Too many requests' });
    }
  } catch (err) {
    // Fail closed: if the limit cannot be checked, nothing is sent.
    console.error('Rate limit unavailable:', err);
    return json(503, { error: 'Try again shortly' });
  }

  const header = event.headers.authorization || event.headers.Authorization || '';
  const accessToken = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!accessToken) {
    return json(401, { error: 'Sign in to receive this email' });
  }

  let user: SupabaseUser | null;
  try {
    user = await userForToken(accessToken, env);
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

  let claimed: boolean;
  try {
    claimed = await claimWelcome(env, user.id);
  } catch (err) {
    console.error('Could not claim the welcome email:', err);
    return json(503, { error: 'Try again shortly' });
  }
  if (!claimed) {
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
      await releaseClaim(env, user.id);
      return json(502, { error: 'Failed to send email' });
    }
    const sent = (await res.json()) as { id?: string };
    await markSent(env, user.id, sent.id || null);
    return json(200, { status: 'sent', id: sent.id || null });
  } catch (err) {
    console.error('Welcome email failed:', err);
    await releaseClaim(env, user.id).catch(() => {});
    return json(502, { error: 'Email service unavailable' });
  }
};
