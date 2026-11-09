import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// In-memory stand-in for Netlify Blobs. Shared across calls, so duplicate checks see earlier sends.
const blobs = vi.hoisted(() => ({ data: new Map<string, string>() }));
vi.mock('@netlify/blobs', () => ({
  getStore: () => ({
    get: async (key: string) => blobs.data.get(key) ?? null,
    set: async (key: string, value: string) => {
      blobs.data.set(key, value);
    },
    setJSON: async (key: string, value: unknown) => {
      blobs.data.set(key, JSON.stringify(value));
    },
  }),
}));

import { handler } from '../netlify/functions/send-welcome-email';

const SUPABASE = 'https://supabase.test';
const RECENT = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const OLD = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

const account = (overrides: Record<string, unknown> = {}) => ({
  id: 'user-abc',
  email: 'family@example.com',
  created_at: RECENT,
  email_confirmed_at: RECENT,
  ...overrides,
});

const event = (opts: { method?: string; token?: string | null; body?: string; ip?: string } = {}) => ({
  httpMethod: opts.method ?? 'POST',
  headers: {
    ...(opts.token === null ? {} : { authorization: `Bearer ${opts.token ?? 'good-token'}` }),
    'x-nf-client-connection-ip': opts.ip ?? '203.0.113.7',
  },
  body: opts.body ?? JSON.stringify({ email: 'someone-else@example.com' }),
});

// Answers the Supabase user check and the Resend send.
const network = (opts: { user?: Record<string, unknown> | null; resendStatus?: number } = {}) =>
  vi.fn(async (url: string) => {
    if (url.startsWith(`${SUPABASE}/auth/v1/user`)) {
      return opts.user === null
        ? new Response('{"message":"invalid"}', { status: 401 })
        : new Response(JSON.stringify(opts.user === undefined ? account() : opts.user), { status: 200 });
    }
    if (url === 'https://api.resend.com/emails') {
      return new Response(JSON.stringify({ id: 'email-123' }), { status: opts.resendStatus ?? 200 });
    }
    return new Response('', { status: 404 });
  });

const resendCalls = (fetchMock: ReturnType<typeof network>) =>
  fetchMock.mock.calls.filter(([url]) => String(url) === 'https://api.resend.com/emails');

describe('send-welcome-email', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof network>;

  beforeEach(() => {
    blobs.data.clear();
    process.env.VITE_SUPABASE_URL = SUPABASE;
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.RESEND_API_KEY = 'test-resend-key';
    delete process.env.RESEND_FROM_EMAIL;
    fetchMock = network();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends one welcome email to the address on the signed-in account', async () => {
    const res = await handler(event() as any, {} as any);

    expect(res?.statusCode).toBe(200);
    expect(JSON.parse(String(res?.body)).status).toBe('sent');
    const calls = resendCalls(fetchMock);
    expect(calls).toHaveLength(1);
    const [, init] = calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer test-resend-key');
    expect(headers['idempotency-key']).toBe('welcome/user-abc');
    const body = JSON.parse(String(init.body));
    expect(body.to).toEqual(['family@example.com']);
    expect(body.from).toBe('SilverTech Directory <andrew@silvertechdirectory.com>');
  });

  it('ignores any address the browser supplies, and sends only to the account address', async () => {
    await handler(event({ body: JSON.stringify({ email: 'victim@example.com' }) }) as any, {} as any);

    const body = JSON.parse(String((resendCalls(fetchMock)[0] as [string, RequestInit])[1].body));
    expect(body.to).toEqual(['family@example.com']);
    expect(JSON.stringify(body)).not.toContain('victim@example.com');
  });

  it('refuses a request with no session, without contacting the email provider', async () => {
    const res = await handler(event({ token: null }) as any, {} as any);

    expect(res?.statusCode).toBe(401);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a token Supabase does not accept', async () => {
    fetchMock = network({ user: null });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(event({ token: 'forged' }) as any, {} as any);

    expect(res?.statusCode).toBe(401);
    expect(resendCalls(fetchMock)).toHaveLength(0);
  });

  it('refuses an account whose email is not confirmed', async () => {
    fetchMock = network({ user: account({ email_confirmed_at: null }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(event() as any, {} as any);

    expect(res?.statusCode).toBe(403);
    expect(resendCalls(fetchMock)).toHaveLength(0);
  });

  it('refuses an account created outside the welcome window', async () => {
    fetchMock = network({ user: account({ created_at: OLD }) });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(event() as any, {} as any);

    expect(res?.statusCode).toBe(403);
    expect(resendCalls(fetchMock)).toHaveLength(0);
  });

  it('does not send a second welcome email to the same account', async () => {
    const first = await handler(event() as any, {} as any);
    const second = await handler(event() as any, {} as any);

    expect(JSON.parse(String(first?.body)).status).toBe('sent');
    expect(second?.statusCode).toBe(200);
    expect(JSON.parse(String(second?.body)).status).toBe('already_sent');
    expect(resendCalls(fetchMock)).toHaveLength(1);
  });

  it('does not record a failed send, so a later request can still succeed', async () => {
    fetchMock = network({ resendStatus: 500 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const failed = await handler(event() as any, {} as any);
    expect(failed?.statusCode).toBe(502);

    fetchMock = network();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const retried = await handler(event() as any, {} as any);
    expect(JSON.parse(String(retried?.body)).status).toBe('sent');
  });

  it('limits requests from one address per hour', async () => {
    let last: any = null;
    for (let i = 0; i < 25; i++) last = await handler(event({ token: null, ip: '198.51.100.9' }) as any, {} as any);
    expect(last?.statusCode).toBe(429);
  });

  it('only accepts POST', async () => {
    const res = await handler(event({ method: 'GET' }) as any, {} as any);
    expect(res?.statusCode).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to run when its configuration is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const res = await handler(event() as any, {} as any);

    expect(res?.statusCode).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
