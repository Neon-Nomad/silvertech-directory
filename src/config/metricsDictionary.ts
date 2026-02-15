import { parse } from 'yaml';
import dictionaryRaw from '../../metrics-dictionary.yaml?raw';

type MetricGuardrails = {
  hard_min?: number;
  hard_max?: number;
  safe_min?: number;
  safe_max?: number;
  market_default?: number;
  baseline_min?: number;
  baseline_max?: number;
};

type MetricDefinition = {
  display_name: string;
  type?: string;
  status?: string;
  confidence_threshold?: number;
  calculation_logic?: string;
  guardrails?: MetricGuardrails;
  trust_label?: string;
};

type InsufficientDataPlaceholder = {
  title: string;
  body: string;
  cta: string;
};

type MetricsDictionary = {
  version: string;
  last_updated: string;
  context: string;
  metrics: Record<string, MetricDefinition>;
  placeholders?: {
    insufficient_data?: InsufficientDataPlaceholder;
  };
};

const parsed = parse(dictionaryRaw) as MetricsDictionary;

export const metricsDictionary: MetricsDictionary = parsed;

export const getMetric = (metricKey: string): MetricDefinition | undefined =>
  metricsDictionary.metrics?.[metricKey];

export type { MetricDefinition };

export const getMetricTrustLabel = (metricKey: string, fallback: string): string =>
  getMetric(metricKey)?.trust_label || fallback;

export const getMetricConfidenceThreshold = (metricKey: string, fallback: number): number =>
  Number(getMetric(metricKey)?.confidence_threshold ?? fallback);

export const getInsufficientDataPlaceholder = (): InsufficientDataPlaceholder => {
  return (
    metricsDictionary.placeholders?.insufficient_data || {
      title: 'Gathering Insights',
      body: 'We need {remaining} more {unit} to generate a confident benchmark.',
      cta: 'Update Lead Status',
    }
  );
};

export const getRoiGuardrailsPercent = () => {
  const guardrails = getMetric('roi_estimated_impact')?.guardrails;
  const safeMin = Number((guardrails?.safe_min ?? guardrails?.baseline_min ?? 0.01) * 100);
  const safeMax = Number((guardrails?.safe_max ?? guardrails?.baseline_max ?? 0.15) * 100);
  const hardMin = Number((guardrails?.hard_min ?? guardrails?.baseline_min ?? 0.005) * 100);
  const hardMax = Number((guardrails?.hard_max ?? guardrails?.baseline_max ?? 0.2) * 100);
  const marketDefault = Number((guardrails?.market_default ?? 0.05) * 100);

  return {
    hardMin,
    hardMax,
    safeMin,
    safeMax,
    marketDefault,
  };
};
