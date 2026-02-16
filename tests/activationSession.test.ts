// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getActivationSessionId } from '@/src/utils/activationSession';

const KEY = 'std_operator_activation_session_id';
const DAY_MS = 24 * 60 * 60 * 1000;

describe('activationSession', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('reuses a valid localStorage session within TTL', () => {
    const now = new Date('2026-02-16T12:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        id: 'existing-session',
        createdAt: now - 1000,
      }),
    );

    const sessionId = getActivationSessionId();
    expect(sessionId).toBe('existing-session');
  });

  it('rotates session when persisted session is past TTL', () => {
    const now = new Date('2026-02-16T12:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    window.localStorage.setItem(
      KEY,
      JSON.stringify({
        id: 'expired-session',
        createdAt: now - DAY_MS - 1,
      }),
    );

    const sessionId = getActivationSessionId();
    expect(sessionId).not.toBe('expired-session');

    const saved = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    expect(saved.id).toBe(sessionId);
    expect(saved.createdAt).toBe(now);
  });

  it('migrates legacy sessionStorage value into localStorage', () => {
    const now = new Date('2026-02-16T12:00:00.000Z').getTime();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    window.sessionStorage.setItem(KEY, 'legacy-session');

    const sessionId = getActivationSessionId();
    expect(sessionId).toBe('legacy-session');
    expect(window.sessionStorage.getItem(KEY)).toBeNull();

    const saved = JSON.parse(window.localStorage.getItem(KEY) || '{}');
    expect(saved.id).toBe('legacy-session');
    expect(saved.createdAt).toBe(now);
  });
});

