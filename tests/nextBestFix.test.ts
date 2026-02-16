import { describe, expect, it } from 'vitest';
import { getNextBestFix } from '@/src/utils/nextBestFix';

describe('getNextBestFix', () => {
  it('prefers drop-off mapping when available', () => {
    const fix = getNextBestFix({
      dropOff: { fromId: 'view', toId: 'edit' },
      componentCompletion: {
        photos: 0,
        pricing: 0,
        contact: 1,
        amenities: 0,
        qna: 0,
      },
    });

    expect(fix?.source).toBe('dropoff');
    expect(fix?.fixId).toBe('quick_wins');
    expect(fix?.ctaLabel).toBe('Review quick wins panel');
  });

  it('falls back to lowest component completion with tie-break priority', () => {
    const fix = getNextBestFix({
      dropOff: null,
      componentCompletion: {
        photos: 0,
        pricing: 0,
        contact: 0,
        amenities: 0,
        qna: 0,
      },
    });

    expect(fix?.source).toBe('score_component');
    expect(fix?.fixId).toBe('pricing');
    expect(fix?.line).toContain('Add pricing range');
  });
});

