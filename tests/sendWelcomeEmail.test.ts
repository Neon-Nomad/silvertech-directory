import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const SUPABASE = 'https://supabase.test';
const RECENT = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
const OLD = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

type Account = {
  id: string;
  email: string;
  created_at: string;
  email_confirmed_at: string | null;
  user_metadata: Record<string, unknown>;
};

// A fake of the three things the function talks to, shared by every "server instance" in a test.
// The welcome_email_sends table has the primary-key behaviour the real table will have.
const world = {
  accounts: new Map<string, Account>(), // token -> account
  sends: new Map<string, { sent_at: string | null; resend_id: string | null }>(), // user_id -> row
  rate: new Map<string, number>(),
  resendCalls: [] as Array<{ to: string[]; idempotencyKey: string }>,
  resendStatus: 200,
  failRateCheck: false,
  failClaim: false,
};

const fetchFake = vi.fn(async (url: string, init: RequestInit = {}) => {
  const method = init.method ?? 'GET';
  const headers = (init.headers ?? {}) as Record<string, string>;

  if (url === `${SUPABASE}/auth/v1/user`) {
    const token = String(headers.authorization ?? '').replace(/^Bearer /, '');
    const account = world.accounts.get(token);
    return account
      ? new Response(JSON.stringify(account), { status: 200 })
      : new Response('{"message":"invalid"}', { status: 401 });
  }

  if (url === `${SUPABASE}/rest/v1/rpc/welcome_rate_hit`) {
    if (world.failRateCheck) return new Response('boom', { status: 500 });
    const { p_key, p_limit } = JSON.parse(String(init.body));
    const hits = (world.rate.get(p_key) ?? 0) + 1;
    world.rate.set(p_key, hits);
    return new Response(JSON.stringify(hits <= p_limit), { status: 200 });
  }

  if (url.startsWith(`${SUPABASE}/rest/v1/welcome_email_sends`)) {
    if (world.failClaim) return new Response('boom', { status: 500 });
    if (method === 'POST') {
      const { user_id } = JSON.parse(String(init.body));
      if (world.sends.has(user_id)) return new Response('[]', { status: 201 }); // ignore-duplicates
      world.sends.set(user_id, { sent_at: null, resend_id: null });
      return new Response(JSON.stringify([{ user_id }]), { status: 201 });
    }
    const id = decodeURIComponent(new URL(url).searchParams.get('user_id')?.replace('eq.', '') ?? '');
    if (method === 'DELETE') {
      world.sends.delete(id);
      return new Response(null, { status: 204 });
    }
    if (method === 'PATCH') {
      const row = world.sends.get(id);
      if (row) Object.assign(row, JSON.parse(String(init.body)));
      return new Response(null, { status: 204 });
    }
  }

  if (url === 'https://api.resend.com/emails') {
    const body = JSON.parse(String(init.body));
    world.resendCalls.push({ to: body.to, idempotencyKey: headers['idempotency-key'] });
    if (world.resendStatus !== 200) return new Response('{"message":"bad"}', { status: world.resendStatus });
    return new Response(JSON.stringify({ id: `email-${world.resendCalls.length}` }), { status: 200 });
  }

  return new Response('', { status: 404 });
});

// Each call to load() is a fresh copy of the function module, as a separate server instance would have.
const loadInstance = async () => {
  vi.resetModules();
  const mod = await import('../netlify/functions/send-welcome-email');
  return mod.handler;
};

const TOKEN_A = 'token-account-a';
const TOKEN_B = 'token-account-b';

const account = (overrides: Partial<Account> = {}): Account => ({
  id: 'user-a',
  email: 'family-a@example.com',
  created_at: RECENT,
  email_confirmed_at: RECENT,
  user_metadata: {},
  ...overrides,
});

let ipCounter = 0;
const event = (opts: { method?: string; token?: string | null; body?: string; ip?: string } = {}) => ({
  httpMethod: opts.method ?? 'POST',
  headers: {
    ...(opts.token === null ? {} : { authorization: `Bearer ${opts.token ?? TOKEN_A}` }),
    'x-nf-client-connection-ip': opts.ip ?? `203.0.113.${ipCounter++ % 250}`,
  },
  body: opts.body ?? JSON.stringify({ email: 'someone-else@example.com' }),
});

const parse = (res: any) => JSON.parse(String(res?.body));

describe('send-welcome-email', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    world.accounts.clear();
    world.accounts.set(TOKEN_A, account());
    world.sends.clear();
    world.rate.clear();
    world.resendCalls.length = 0;
    world.resendStatus = 200;
    world.failRateCheck = false;
    world.failClaim = false;
    fetchFake.mockClear();
    globalThis.fetch = fetchFake as unknown as typeof fetch;
    process.env.VITE_SUPABASE_URL = SUPABASE;
    process.env.VITE_SUPABASE_ANON_KEY = 'anon-key';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
    process.env.RESEND_API_KEY = 'test-resend-key';
    delete process.env.RESEND_FROM_EMAIL;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  describe('legitimate registration', () => {
    it('sends one welcome email to the signed-in account and records it server-side', async () => {
      const handler = await loadInstance();
      const res = await handler(event() as any, {} as any);

      expect(res?.statusCode).toBe(200);
      expect(parse(res).status).toBe('sent');
      expect(world.resendCalls).toEqual([{ to: ['family-a@example.com'], idempotencyKey: 'welcome/user-a' }]);
      expect(world.sends.get('user-a')?.sent_at).toEqual(expect.any(String));
      expect(world.sends.get('user-a')?.resend_id).toBe('email-1');
    });

    it('uses the service-role key only on the server-side calls, never on the account check', async () => {
      const handler = await loadInstance();
      await handler(event() as any, {} as any);

      const accountCall = fetchFake.mock.calls.find(([url]) => url === `${SUPABASE}/auth/v1/user`) as any;
      expect(accountCall[1].headers.authorization).toBe(`Bearer ${TOKEN_A}`);
      expect(JSON.stringify(accountCall[1].headers)).not.toContain('service-key');
    });
  });

  describe('one welcome email per account', () => {
    it('does not send a second time to the same account', async () => {
      const handler = await loadInstance();
      await handler(event() as any, {} as any);
      const second = await handler(event() as any, {} as any);

      expect(parse(second).status).toBe('already_sent');
      expect(world.resendCalls).toHaveLength(1);
    });

    it('sends exactly once when many requests arrive at the same moment', async () => {
      const handler = await loadInstance();
      const results = await Promise.all(Array.from({ length: 8 }, () => handler(event() as any, {} as any)));

      expect(world.resendCalls).toHaveLength(1);
      expect(results.map((r) => parse(r).status).filter((s) => s === 'sent')).toHaveLength(1);
    });

    it('sends at most once across separate server instances that share the store', async () => {
      const instanceOne = await loadInstance();
      const instanceTwo = await loadInstance();
      await instanceOne(event() as any, {} as any);
      const elsewhere = await instanceTwo(event() as any, {} as any);

      expect(parse(elsewhere).status).toBe('already_sent');
      expect(world.resendCalls).toHaveLength(1);
    });

    it('a failed send releases the claim, so a later request can still succeed', async () => {
      const handler = await loadInstance();
      world.resendStatus = 500;
      const failed = await handler(event() as any, {} as any);
      expect(failed?.statusCode).toBe(502);
      expect(world.sends.has('user-a')).toBe(false);

      world.resendStatus = 200;
      const retried = await handler(event() as any, {} as any);
      expect(parse(retried).status).toBe('sent');
    });
  });

  describe('users cannot change their own welcome status', () => {
    it('ignores a welcome flag written into account metadata, in either direction', async () => {
      const handler = await loadInstance();
      await handler(event() as any, {} as any);

      // The owner clears the flag: nothing changes, because the server's record is what counts.
      world.accounts.get(TOKEN_A)!.user_metadata = { welcome_sent_at: null };
      expect(parse(await handler(event() as any, {} as any)).status).toBe('already_sent');

      // The owner sets the flag on an account that was never sent: the flag does not stop the send.
      world.accounts.set(TOKEN_B, account({ id: 'user-b', email: 'family-b@example.com' }));
      world.accounts.get(TOKEN_B)!.user_metadata = { welcome_sent_at: '2026-01-01T00:00:00Z' };
      expect(parse(await handler(event({ token: TOKEN_B }) as any, {} as any)).status).toBe('sent');
    });

    it('cannot clear the record by any request, so a repeat is still refused', async () => {
      const handler = await loadInstance();
      await handler(event() as any, {} as any);
      await handler(event({ method: 'DELETE' }) as any, {} as any);
      await handler(event({ body: JSON.stringify({ reset: true, user_id: 'user-a' }) }) as any, {} as any);

      expect(parse(await handler(event() as any, {} as any)).status).toBe('already_sent');
      expect(world.resendCalls).toHaveLength(1);
    });
  });

  describe('identity cannot be forged', () => {
    it('sends only to the account of the token presented, whatever address the body names', async () => {
      const handler = await loadInstance();
      world.accounts.set(TOKEN_B, account({ id: 'user-b', email: 'family-b@example.com' }));
      await handler(event({ token: TOKEN_B, body: JSON.stringify({ email: 'family-a@example.com' }) }) as any, {} as any);

      expect(world.resendCalls).toEqual([{ to: ['family-b@example.com'], idempotencyKey: 'welcome/user-b' }]);
    });

    it('refuses a token Supabase does not accept, before any send', async () => {
      const handler = await loadInstance();
      const res = await handler(event({ token: 'made-up' }) as any, {} as any);

      expect(res?.statusCode).toBe(401);
      expect(world.resendCalls).toHaveLength(0);
      expect(world.sends.size).toBe(0);
    });

    it('refuses a request with no session at all', async () => {
      const handler = await loadInstance();
      const res = await handler(event({ token: null, body: JSON.stringify({ email: 'victim@example.com' }) }) as any, {} as any);

      expect(res?.statusCode).toBe(401);
      expect(world.resendCalls).toHaveLength(0);
    });

    it('refuses an unconfirmed account', async () => {
      const handler = await loadInstance();
      world.accounts.set(TOKEN_A, account({ email_confirmed_at: null }));
      const res = await handler(event() as any, {} as any);

      expect(res?.statusCode).toBe(403);
      expect(world.resendCalls).toHaveLength(0);
    });

    it('refuses an account created outside the welcome window', async () => {
      const handler = await loadInstance();
      world.accounts.set(TOKEN_A, account({ created_at: OLD }));
      const res = await handler(event() as any, {} as any);

      expect(res?.statusCode).toBe(403);
      expect(world.resendCalls).toHaveLength(0);
    });
  });

  describe('abuse limits', () => {
    it('limits requests from one client address per hour, across server instances', async () => {
      const first = await loadInstance();
      const second = await loadInstance();
      let last: any = null;
      for (let i = 0; i < 25; i++) {
        last = await (i % 2 ? first : second)(event({ token: null, ip: '198.51.100.9' }) as any, {} as any);
      }
      expect(last?.statusCode).toBe(429);
    });

    it('does not let one address exhaust the limit for another', async () => {
      const handler = await loadInstance();
      for (let i = 0; i < 25; i++) await handler(event({ token: null, ip: '198.51.100.9' }) as any, {} as any);
      const other = await handler(event({ ip: '198.51.100.10' }) as any, {} as any);

      expect(other?.statusCode).toBe(200);
    });

    it('stores only a hash of the client address', async () => {
      const handler = await loadInstance();
      await handler(event({ token: null, ip: '198.51.100.77' }) as any, {} as any);

      expect([...world.rate.keys()].join(' ')).not.toContain('198.51.100.77');
    });

    it('sends nothing when the limit cannot be checked (fail closed)', async () => {
      const handler = await loadInstance();
      world.failRateCheck = true;
      const res = await handler(event() as any, {} as any);

      expect(res?.statusCode).toBe(503);
      expect(world.resendCalls).toHaveLength(0);
    });

    it('sends nothing when the record cannot be claimed', async () => {
      const handler = await loadInstance();
      world.failClaim = true;
      const res = await handler(event() as any, {} as any);

      expect(res?.statusCode).toBe(503);
      expect(world.resendCalls).toHaveLength(0);
    });
  });

  describe('request shape and configuration', () => {
    it('only accepts POST', async () => {
      const handler = await loadInstance();
      const res = await handler(event({ method: 'GET' }) as any, {} as any);

      expect(res?.statusCode).toBe(405);
      expect(fetchFake).not.toHaveBeenCalled();
    });

    it('refuses to run without the service-role key, and sends nothing', async () => {
      const handler = await loadInstance();
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;
      const res = await handler(event() as any, {} as any);

      expect(res?.statusCode).toBe(500);
      expect(world.resendCalls).toHaveLength(0);
    });
  });
});
