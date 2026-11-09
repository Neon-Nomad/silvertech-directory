import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../netlify/functions/send-welcome-email';

const SUPABASE = 'https://supabase.test';
const RECENT = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const OLD = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

let ipCounter = 0;

const event = (opts: { method?: string; token?: string | null; body?: string; ip?: string } = {}) => ({
  httpMethod: opts.method ?? 'POST',
  headers: {
    ...(opts.token === null ? {} : { authorization: `Bearer ${opts.token ?? 'good-token'}` }),
    // A fresh address per request, unless a test sets one, so the per-address limit cannot leak between tests.
    'x-nf-client-connection-ip': opts.ip ?? `203.0.113.${ipCounter++ % 250}`,
  },
  body: opts.body ?? JSON.stringify({ email: 'someone-else@example.com' }),
});

// A fake Supabase account and Resend. The account keeps its metadata, so a recorded send is seen by later requests.
type Account = { user: Record<string, unknown> | null };

const fakeNetwork = (opts: { account?: Partial<Record<string, unknown>> | null; resendStatus?: number } = {}) => {
  const state: Account = {
    user:
      opts.account === null
        ? null
        : {
            id: 'user-abc',
            email: 'family@example.com',
            created_at: RECENT,
            email_confirmed_at: RECENT,
            user_metadata: { email: 'family@example.com', email_verified: true },
            ...(opts.account ?? {}),
          },
  };
  const fetchMock = vi.fn(async (url: string, init?: RequestInit) => {
    if (url === `${SUPABASE}/auth/v1/user` && (init?.method ?? 'GET') === 'GET') {
      return state.user
        ? new Response(JSON.stringify(state.user), { status: 200 })
        : new Response('{"message":"invalid"}', { status: 401 });
    }
    if (url === `${SUPABASE}/auth/v1/user` && init?.method === 'PUT') {
      const body = JSON.parse(String(init.body));
      state.user = { ...(state.user as object), user_metadata: body.data };
      return new Response(JSON.stringify(state.user), { status: 200 });
    }
    if (url === 'https://api.resend.com/emails') {
      return new Response(JSON.stringify({ id: 'email-123' }), { status: opts.resendStatus ?? 200 });
    }
    return new Response('', { status: 404 });
  });
  return { fetchMock, state };
};

const resendCalls = (fetchMock: ReturnType<typeof fakeNetwork>['fetchMock']) =>
  fetchMock.mock.calls.filter(([url]) => String(url) === 'https://api.resend.com/emails');

describe('send-welcome-email', () => {
  const originalFetch = globalThis.fetch;
  let net: ReturnType<typeof fakeNetwork>;

  beforeEach(() => {
    process.env.VITE_SUPABASE_URL = SUPABASE;
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.RESEND_API_KEY = 'test-resend-key';
    delete process.env.RESEND_FROM_EMAIL;
    net = fakeNetwork();
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
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
    const calls = resendCalls(net.fetchMock);
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

    const body = JSON.parse(String((resendCalls(net.fetchMock)[0] as [string, RequestInit])[1].body));
    expect(body.to).toEqual(['family@example.com']);
    expect(JSON.stringify(body)).not.toContain('victim@example.com');
  });

  it('records the send on the account and keeps the account\'s other metadata', async () => {
    net = fakeNetwork({ account: { user_metadata: { email: 'family@example.com', role: 'family' } } });
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
    await handler(event() as any, {} as any);

    const metadata = net.state.user?.user_metadata as Record<string, unknown>;
    expect(typeof metadata.welcome_sent_at).toBe('string');
    expect(metadata.role).toBe('family');
    expect(metadata.email).toBe('family@example.com');
  });

  it('does not send a second welcome email to the same account', async () => {
    const first = await handler(event() as any, {} as any);
    const second = await handler(event() as any, {} as any);

    expect(JSON.parse(String(first?.body)).status).toBe('sent');
    expect(second?.statusCode).toBe(200);
    expect(JSON.parse(String(second?.body)).status).toBe('already_sent');
    expect(resendCalls(net.fetchMock)).toHaveLength(1);
  });

  it('treats an account that already has a welcome record as already sent', async () => {
    net = fakeNetwork({ account: { user_metadata: { welcome_sent_at: RECENT } } });
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
    const res = await handler(event() as any, {} as any);

    expect(JSON.parse(String(res?.body)).status).toBe('already_sent');
    expect(resendCalls(net.fetchMock)).toHaveLength(0);
  });

  it('does not record a failed send, so a later sign-in can still succeed', async () => {
    net = fakeNetwork({ resendStatus: 500 });
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
    const failed = await handler(event() as any, {} as any);
    expect(failed?.statusCode).toBe(502);
    expect((net.state.user?.user_metadata as Record<string, unknown>).welcome_sent_at).toBeUndefined();

    net = fakeNetwork();
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
    const retried = await handler(event() as any, {} as any);
    expect(JSON.parse(String(retried?.body)).status).toBe('sent');
  });

  it('refuses a request with no session, without contacting the email provider', async () => {
    const res = await handler(event({ token: null }) as any, {} as any);

    expect(res?.statusCode).toBe(401);
    expect(net.fetchMock).not.toHaveBeenCalled();
  });

  it('refuses a token Supabase does not accept', async () => {
    net = fakeNetwork({ account: null });
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
    const res = await handler(event({ token: 'forged' }) as any, {} as any);

    expect(res?.statusCode).toBe(401);
    expect(resendCalls(net.fetchMock)).toHaveLength(0);
  });

  it('refuses an account whose email is not confirmed', async () => {
    net = fakeNetwork({ account: { email_confirmed_at: null } });
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
    const res = await handler(event() as any, {} as any);

    expect(res?.statusCode).toBe(403);
    expect(resendCalls(net.fetchMock)).toHaveLength(0);
  });

  it('refuses an account created outside the welcome window', async () => {
    net = fakeNetwork({ account: { created_at: OLD } });
    globalThis.fetch = net.fetchMock as unknown as typeof fetch;
    const res = await handler(event() as any, {} as any);

    expect(res?.statusCode).toBe(403);
    expect(resendCalls(net.fetchMock)).toHaveLength(0);
  });

  it('limits requests from one address per hour', async () => {
    let last: any = null;
    for (let i = 0; i < 25; i++) last = await handler(event({ token: null, ip: '198.51.100.9' }) as any, {} as any);
    expect(last?.statusCode).toBe(429);
  });

  it('only accepts POST', async () => {
    const res = await handler(event({ method: 'GET' }) as any, {} as any);
    expect(res?.statusCode).toBe(405);
    expect(net.fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to run when its configuration is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const res = await handler(event() as any, {} as any);

    expect(res?.statusCode).toBe(500);
    expect(net.fetchMock).not.toHaveBeenCalled();
  });
});
