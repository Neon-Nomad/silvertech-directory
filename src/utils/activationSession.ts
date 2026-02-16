const ACTIVATION_SESSION_STORAGE_KEY = 'std_operator_activation_session_id';
const ACTIVATION_SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000;

type ActivationSessionRecord = {
  id: string;
  createdAt: number;
};

const createSessionId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session_${Math.random().toString(36).slice(2, 12)}`;
};

export const getActivationSessionId = (): string => {
  if (typeof window === 'undefined') return 'server-session';

  const now = Date.now();
  const persisted = window.localStorage.getItem(ACTIVATION_SESSION_STORAGE_KEY);
  if (persisted) {
    try {
      const parsed = JSON.parse(persisted) as ActivationSessionRecord;
      if (
        parsed &&
        typeof parsed.id === 'string' &&
        typeof parsed.createdAt === 'number' &&
        now - parsed.createdAt <= ACTIVATION_SESSION_EXPIRY_MS
      ) {
        return parsed.id;
      }
    } catch {
      // Ignore malformed persisted session and create a fresh one below.
    }
  }

  // One-time migration from older session-scoped storage.
  const legacySessionId = window.sessionStorage.getItem(ACTIVATION_SESSION_STORAGE_KEY);
  if (legacySessionId) {
    const migrated: ActivationSessionRecord = { id: legacySessionId, createdAt: now };
    window.localStorage.setItem(ACTIVATION_SESSION_STORAGE_KEY, JSON.stringify(migrated));
    window.sessionStorage.removeItem(ACTIVATION_SESSION_STORAGE_KEY);
    return legacySessionId;
  }

  const next = createSessionId();
  const record: ActivationSessionRecord = { id: next, createdAt: now };
  window.localStorage.setItem(ACTIVATION_SESSION_STORAGE_KEY, JSON.stringify(record));
  return next;
};
