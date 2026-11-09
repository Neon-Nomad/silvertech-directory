import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../netlify/functions/send-welcome-email';

const request = (body: unknown, httpMethod = 'POST') => ({
  httpMethod,
  body: typeof body === 'string' ? body : JSON.stringify(body),
});

const resendOk = () => new Response(JSON.stringify({ id: 'email-123' }), { status: 200 });

describe('send-welcome-email', () => {
  const originalFetch = globalThis.fetch;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    delete process.env.RESEND_FROM_EMAIL;
    fetchMock = vi.fn(async () => resendOk());
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends one welcome email through Resend, with the key and a per-day idempotency key', async () => {
    const res = await handler(request({ email: 'family@example.com' }) as any, {} as any);

    expect(res?.statusCode).toBe(200);
    expect(JSON.parse(String(res?.body)).id).toBe('email-123');
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.resend.com/emails');
    const headers = init.headers as Record<string, string>;
    expect(headers.authorization).toBe('Bearer test-resend-key');
    expect(headers['idempotency-key']).toMatch(/^welcome-email\/family@example\.com\/\d{4}-\d{2}-\d{2}$/);
    const body = JSON.parse(String(init.body));
    expect(body.from).toBe('SilverTech Directory <andrew@silvertechdirectory.com>');
    expect(body.to).toEqual(['family@example.com']);
    expect(body.subject).toBe('Welcome to SilverTech Directory!');
    expect(body.html).toContain('https://silvertechdirectory.com/login');
  });

  it('rejects anything that is not an email address, without calling the provider', async () => {
    for (const email of ['', 'not-an-email', 'a@b', 'x'.repeat(250) + '@example.com']) {
      const res = await handler(request({ email }) as any, {} as any);
      expect(res?.statusCode).toBe(400);
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects oversized and malformed requests', async () => {
    expect((await handler(request('x'.repeat(2000)) as any, {} as any))?.statusCode).toBe(413);
    expect((await handler(request('{not json') as any, {} as any))?.statusCode).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('only accepts POST', async () => {
    const res = await handler(request({ email: 'family@example.com' }, 'GET') as any, {} as any);
    expect(res?.statusCode).toBe(405);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('refuses to send when the Resend key is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const res = await handler(request({ email: 'family@example.com' }) as any, {} as any);

    expect(res?.statusCode).toBe(500);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('reports a provider failure instead of claiming success', async () => {
    fetchMock.mockImplementation(async () => new Response('{"message":"bad"}', { status: 422 }));
    const res = await handler(request({ email: 'family@example.com' }) as any, {} as any);

    expect(res?.statusCode).toBe(502);
  });
});
