import { describe, expect, it } from 'vitest';
import {
  ACTIVATION_EVENT_NAMES,
  ACTIVATION_REQUIRED_KEYS,
  BENCHMARK_MIN_INQUIRIES,
  BENCHMARK_MIN_PROFILE_VIEWS,
  buildActivationEventPayload,
  isBenchmarkEligible,
  sanitizeActivationScore,
  shouldShowPremiumCta,
} from '@/src/config/activationEvents';

describe('activationEvents contract', () => {
  it('includes canonical activation funnel milestones', () => {
    expect(ACTIVATION_EVENT_NAMES).toContain('operator_claim_completed');
    expect(ACTIVATION_EVENT_NAMES).toContain('operator_activation_screen_viewed');
    expect(ACTIVATION_EVENT_NAMES).toContain('premium_trial_started');
  });

  it('keeps required event context keys stable', () => {
    expect(ACTIVATION_REQUIRED_KEYS).toEqual([
      'operator_id',
      'facility_id',
      'session_id',
      'plan_tier',
      'activation_score',
      'source_screen',
    ]);
  });

  it('enforces benchmark thresholds', () => {
    expect(isBenchmarkEligible(BENCHMARK_MIN_PROFILE_VIEWS, BENCHMARK_MIN_INQUIRIES)).toBe(true);
    expect(isBenchmarkEligible(BENCHMARK_MIN_PROFILE_VIEWS - 1, BENCHMARK_MIN_INQUIRIES)).toBe(false);
    expect(isBenchmarkEligible(BENCHMARK_MIN_PROFILE_VIEWS, BENCHMARK_MIN_INQUIRIES - 1)).toBe(false);
  });

  it('enforces deterministic premium cta gate logic', () => {
    expect(shouldShowPremiumCta({ checklistCompletion: 0.9, photos: 12, benchmarkGapPct: 0.02 })).toBe(false);
    expect(shouldShowPremiumCta({ checklistCompletion: 0.7, photos: 12, benchmarkGapPct: 0.02 })).toBe(true);
    expect(shouldShowPremiumCta({ checklistCompletion: 0.9, photos: 8, benchmarkGapPct: 0.02 })).toBe(true);
    expect(shouldShowPremiumCta({ checklistCompletion: 0.9, photos: 12, benchmarkGapPct: 0.03 })).toBe(true);
  });

  it('normalizes activation score and injects timestamp when missing', () => {
    const payload = buildActivationEventPayload({
      operator_id: 'op-1',
      facility_id: 'fac-1',
      session_id: 'sess-1',
      plan_tier: 'free',
      activation_score: 122,
      source_screen: 'dashboard_overview',
    });

    expect(payload.activation_score).toBe(100);
    expect(typeof payload.timestamp).toBe('string');
    expect(sanitizeActivationScore(Number.NaN)).toBe(0);
    expect(sanitizeActivationScore(-20)).toBe(0);
  });
});

