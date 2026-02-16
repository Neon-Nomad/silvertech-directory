import { describe, expect, it } from 'vitest';
import { buildActivationSnapshot } from '@/src/utils/activationSnapshot';

describe('buildActivationSnapshot', () => {
  it('builds deterministic score, gates, and fallback next fix', () => {
    const snapshot = buildActivationSnapshot({
      asOf: '2026-02-16T00:00:00.000Z',
      completedStepIds: new Set(['contact_info']),
      funnelStages: [],
      onboardingViews: 10,
      onboardingInquiries: 1,
      marketMedianConversion: 0.19,
    });

    expect(snapshot.score.value).toBe(15);
    expect(snapshot.benchmark.ready).toBe(false);
    expect(snapshot.roi.ready).toBe(false);
    expect(snapshot.nextFix?.fixId).toBe('pricing');
    expect(snapshot.quickWins.items).toEqual(['photos_missing', 'pricing_missing', 'qa_pending']);
  });

  it('prefers drop-off mapped next fix when funnel has a top leak', () => {
    const snapshot = buildActivationSnapshot({
      asOf: '2026-02-16T00:00:00.000Z',
      completedStepIds: new Set(['contact_info', 'pricing']),
      funnelStages: [
        { id: 'claim', label: 'Claim completed', count: 10, rate: 1 },
        { id: 'view', label: 'Dashboard viewed', count: 9, rate: 0.9 },
        { id: 'edit', label: 'First edit made', count: 3, rate: 0.3 },
      ],
      onboardingViews: 40,
      onboardingInquiries: 8,
      marketMedianConversion: 0.19,
    });

    expect(snapshot.funnel.topDrop?.fromId).toBe('view');
    expect(snapshot.funnel.topDrop?.toId).toBe('edit');
    expect(snapshot.nextFix?.source).toBe('dropoff');
    expect(snapshot.nextFix?.fixId).toBe('quick_wins');
  });
});

