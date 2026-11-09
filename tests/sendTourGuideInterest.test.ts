import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { handler } from '../netlify/functions/send-tour-guide';

const MAPPED = 'dd27d2dd-58fe-4cf5-add0-5e186beba37a';

const request = (extra: Record<string, unknown> = {}) => ({
  httpMethod: 'POST',
  body: JSON.stringify({
    email: 'family@example.com',
    facilityId: 'abiitan-mill-city-1',
    facilityName: 'Abiitan Mill City',
    facilityAddress: '100 Test Way',
    facilityPhone: '612-555-0101',
    careType: 'memory-care',
    optedIn: false,
    ...extra,
  }),
});

// Answers the three outbound calls the function can make: email, reviewed-identity check, and interest insert.
const network = (opts: { reviewed: string[]; insertStatus?: number; emailStatus?: number }) =>
  vi.fn(async (url: string) => {
    if (url.startsWith('https://api.resend.com/emails')) return new Response('{}', { status: opts.emailStatus ?? 200 });
    if (url.includes('/rest/v1/rpc/reviewed_facility_ids')) return new Response(JSON.stringify(opts.reviewed), { status: 200 });
    if (url.includes('/rest/v1/facility_tour_interest')) return new Response('', { status: opts.insertStatus ?? 201 });
    return new Response('', { status: 404 });
  });

const insertCalls = (fetchMock: ReturnType<typeof network>) =>
  fetchMock.mock.calls.filter(([url]) => String(url).includes('/rest/v1/facility_tour_interest'));

describe('send-tour-guide: tour interest', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    process.env.VITE_SUPABASE_URL = 'https://supabase.test';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('records interest for a reviewed listing, keyed by the database UUID', async () => {
    const fetchMock = network({ reviewed: [MAPPED] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(request({ facilityUuid: MAPPED }) as any, {} as any);
    expect(res?.statusCode).toBe(200);
    expect(JSON.parse(String(res?.body)).interestRecorded).toBe(true);
    const [, init] = insertCalls(fetchMock)[0];
    expect(JSON.parse(String(init?.body)).facility_id).toBe(MAPPED);
  });

  it('sends the guide but records nothing when no UUID is supplied', async () => {
    const fetchMock = network({ reviewed: [MAPPED] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(request() as any, {} as any);
    expect(res?.statusCode).toBe(200);
    expect(JSON.parse(String(res?.body)).interestRecorded).toBe(false);
    expect(insertCalls(fetchMock)).toHaveLength(0);
  });

  it('rejects a malformed UUID before any database call', async () => {
    const fetchMock = network({ reviewed: [] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(request({ facilityUuid: 'abiitan-mill-city-1' }) as any, {} as any);
    expect(JSON.parse(String(res?.body)).interestRecorded).toBe(false);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/rest/v1/'))).toBe(false);
  });

  it('records nothing for an identity the database does not list as reviewed', async () => {
    const fetchMock = network({ reviewed: [] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(request({ facilityUuid: MAPPED }) as any, {} as any);
    expect(res?.statusCode).toBe(200);
    expect(JSON.parse(String(res?.body)).interestRecorded).toBe(false);
    expect(insertCalls(fetchMock)).toHaveLength(0);
  });

  it('still returns success when the interest insert is refused, and says it was not recorded', async () => {
    const fetchMock = network({ reviewed: [MAPPED], insertStatus: 403 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(request({ facilityUuid: MAPPED }) as any, {} as any);
    expect(res?.statusCode).toBe(200);
    expect(JSON.parse(String(res?.body)).interestRecorded).toBe(false);
  });

  it('does not log interest when the email itself fails', async () => {
    const fetchMock = network({ reviewed: [MAPPED], emailStatus: 500 });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(request({ facilityUuid: MAPPED }) as any, {} as any);
    expect(res?.statusCode).toBe(502);
    expect(insertCalls(fetchMock)).toHaveLength(0);
  });
});

describe('send-tour-guide: email provider', () => {
  const originalFetch = globalThis.fetch;
  beforeEach(() => {
    process.env.RESEND_API_KEY = 'test-resend-key';
    delete process.env.RESEND_FROM_EMAIL;
    process.env.VITE_SUPABASE_URL = 'https://supabase.test';
    process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('sends through Resend with the API key and a sender on the verified domain', async () => {
    const fetchMock = network({ reviewed: [MAPPED] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    await handler(request({ facilityUuid: MAPPED }) as any, {} as any);

    const emailCall = fetchMock.mock.calls.find(([url]) => String(url) === 'https://api.resend.com/emails');
    expect(emailCall).toBeDefined();
    const [, init] = emailCall as [string, RequestInit];
    expect((init.headers as Record<string, string>).authorization).toBe('Bearer test-resend-key');
    const body = JSON.parse(String(init.body));
    expect(body.from).toBe('SilverTech Directory <hello@silvertechdirectory.com>');
    expect(body.to).toEqual(['family@example.com']);
    expect(body.htmlContent).toBeUndefined();
    expect(body.html).toContain('Abiitan Mill City');
  });

  it('refuses to send, and says so, when the Resend key is missing', async () => {
    delete process.env.RESEND_API_KEY;
    const fetchMock = network({ reviewed: [MAPPED] });
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    const res = await handler(request({ facilityUuid: MAPPED }) as any, {} as any);

    expect(res?.statusCode).toBe(500);
    expect(fetchMock.mock.calls.some(([url]) => String(url).includes('resend.com'))).toBe(false);
  });
});
