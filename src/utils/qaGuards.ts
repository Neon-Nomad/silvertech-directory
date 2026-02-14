const QUESTION_RATE_LIMIT = 5;
const QUESTION_RATE_WINDOW_MS = 24 * 60 * 60 * 1000;

const PROHIBITED_WORDS = ['fuck', 'shit', 'bitch', 'asshole', 'motherfucker'];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const stripHtml = (value: string) => value.replace(/<[^>]*>/g, '');

const containsProfanity = (value: string) => {
  const text = ` ${normalize(value)} `;
  return PROHIBITED_WORDS.some((word) => text.includes(` ${word} `));
};

const diceCoefficient = (a: string, b: string) => {
  if (a.length < 2 || b.length < 2) {
    return a === b ? 1 : 0;
  }

  const makeBigrams = (text: string) => {
    const bigrams: string[] = [];
    for (let i = 0; i < text.length - 1; i += 1) {
      bigrams.push(text.slice(i, i + 2));
    }
    return bigrams;
  };

  const aBigrams = makeBigrams(a);
  const bBigrams = makeBigrams(b);
  const counts = new Map<string, number>();

  for (const bigram of aBigrams) {
    counts.set(bigram, (counts.get(bigram) || 0) + 1);
  }

  let overlap = 0;
  for (const bigram of bBigrams) {
    const count = counts.get(bigram) || 0;
    if (count > 0) {
      overlap += 1;
      counts.set(bigram, count - 1);
    }
  }

  return (2 * overlap) / (aBigrams.length + bBigrams.length);
};

export const checkQuestionRateLimit = (userId: string) => {
  if (typeof window === 'undefined') return { allowed: true as const };

  const key = `qa_submissions_${userId}`;
  const now = Date.now();

  let rawTimestamps: number[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(parsed)) {
      rawTimestamps = parsed.filter((v) => Number.isFinite(v));
    }
  } catch {
    rawTimestamps = [];
  }

  const recent = rawTimestamps.filter((t) => now - t <= QUESTION_RATE_WINDOW_MS);

  if (recent.length >= QUESTION_RATE_LIMIT) {
    localStorage.setItem(key, JSON.stringify(recent));
    return {
      allowed: false as const,
      message: 'You have reached the question limit for today. Please try again tomorrow.',
    };
  }

  return { allowed: true as const };
};

export const recordQuestionSubmission = (userId: string) => {
  if (typeof window === 'undefined') return;

  const key = `qa_submissions_${userId}`;
  const now = Date.now();

  let rawTimestamps: number[] = [];
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    if (Array.isArray(parsed)) {
      rawTimestamps = parsed.filter((v) => Number.isFinite(v));
    }
  } catch {
    rawTimestamps = [];
  }

  const recent = rawTimestamps.filter((t) => now - t <= QUESTION_RATE_WINDOW_MS);
  recent.push(now);
  localStorage.setItem(key, JSON.stringify(recent));
};

export const checkDuplicateText = (text: string, existingQuestions: string[]) => {
  const source = normalize(text);
  if (!source) return { isDuplicate: false as const };

  for (const existing of existingQuestions) {
    const candidate = normalize(existing);
    if (!candidate) continue;
    if (diceCoefficient(source, candidate) >= 0.85) {
      return {
        isDuplicate: true as const,
        message: 'This question looks very similar to an existing one. Please check current Q&A first.',
      };
    }
  }

  return { isDuplicate: false as const };
};

type SanitizedBlocked = {
  blocked: true;
  sanitizedText: string;
  warnings: string[];
  message: string;
};

type SanitizedAllowed = {
  blocked: false;
  sanitizedText: string;
  warnings: string[];
  message?: string;
};

export type SanitizedInputResult = SanitizedBlocked | SanitizedAllowed;

export const sanitizeInput = (text: string): SanitizedInputResult => {
  const withoutHtml = stripHtml(text);
  const sanitizedText = withoutHtml.replace(/\s+/g, ' ').trim();
  const warnings: string[] = [];

  const hasPhone = /\b(?:\+?1[\s.-]*)?\(?\d{3}\)?[\s.-]*\d{3}[\s.-]*\d{4}\b/.test(sanitizedText);
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(sanitizedText);
  const hasSsn = /\b\d{3}-\d{2}-\d{4}\b/.test(sanitizedText);

  if (hasPhone || hasEmail || hasSsn) {
    warnings.push('Please avoid sharing private personal information in public questions.');
  }

  if (containsProfanity(sanitizedText)) {
    return {
      blocked: true as const,
      sanitizedText,
      warnings,
      message: 'Please remove offensive language before submitting your question.',
    };
  }

  return {
    blocked: false as const,
    sanitizedText,
    warnings,
    message: undefined,
  };
};
