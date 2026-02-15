import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { formatAsOfDate, formatAsOfLabel, formatRelativeTime } from '@/src/utils/timeFormatting';

describe('timeFormatting', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-02-15T12:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats relative times for minutes and hours', () => {
    expect(formatRelativeTime(new Date('2026-02-15T11:55:00.000Z'))).toBe('5m ago');
    expect(formatRelativeTime(new Date('2026-02-15T10:00:00.000Z'))).toBe('2h ago');
  });

  it('formats absolute label with Data as of prefix', () => {
    const result = formatAsOfLabel(new Date('2026-02-14T12:00:00.000Z'), 'absolute');
    expect(result).toMatch(/^Data as of /);
    expect(result).toContain('2026');
  });

  it('handles leap-year dates in absolute formatter', () => {
    const leap = formatAsOfDate(new Date('2024-02-29T08:00:00.000Z'));
    expect(leap).toContain('2024');
  });

  it('handles timezone-offset strings safely', () => {
    const withOffset = formatRelativeTime('2026-02-15T06:30:00-05:00');
    expect(withOffset).toMatch(/ago$/);
  });
});

