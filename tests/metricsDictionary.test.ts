import { describe, expect, it } from 'vitest';
import {
  getMetric,
  getMetricConfidenceThreshold,
  getMetricTrustLabel,
  getRoiGuardrailsPercent,
} from '@/src/config/metricsDictionary';

describe('metricsDictionary', () => {
  it('returns ROI metric with expected guardrail values', () => {
    const metric = getMetric('roi_estimated_impact');
    expect(metric).toBeDefined();
    expect(metric?.guardrails?.hard_min).toBe(0.005);
    expect(metric?.guardrails?.hard_max).toBe(0.2);
    expect(metric?.guardrails?.safe_min).toBe(0.01);
    expect(metric?.guardrails?.safe_max).toBe(0.15);
  });

  it('returns ROI percent guardrails in UI units', () => {
    const guardrails = getRoiGuardrailsPercent();
    expect(guardrails.hardMin).toBe(0.5);
    expect(guardrails.hardMax).toBe(20);
    expect(guardrails.safeMin).toBe(1);
    expect(guardrails.safeMax).toBe(15);
    expect(guardrails.marketDefault).toBe(5);
  });

  it('uses fallback when metric key is missing', () => {
    expect(getMetric('missing_metric_key')).toBeUndefined();
    expect(getMetricConfidenceThreshold('missing_metric_key', 9)).toBe(9);
    expect(getMetricTrustLabel('missing_metric_key', 'fallback-label')).toBe('fallback-label');
  });
});

