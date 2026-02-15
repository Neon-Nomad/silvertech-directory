import React, { useMemo, useState } from 'react';
import { getRoiGuardrailsPercent } from '@/src/config/metricsDictionary';
import { parseEntitlementError } from '@/src/utils/billingErrors';

export const IntegrityHarness: React.FC = () => {
  const guardrails = getRoiGuardrailsPercent();
  const [baseline, setBaseline] = useState<number>(guardrails.marketDefault);
  const [errorCode, setErrorCode] = useState<string>('ERR_SLOT_LIMIT');

  const outsideSafeZone = baseline < guardrails.safeMin || baseline > guardrails.safeMax;

  const mappedError = useMemo(() => parseEntitlementError({ code: errorCode }), [errorCode]);

  const ctaLabel =
    mappedError?.code === 'ERR_SLOT_LIMIT'
      ? 'Upgrade Plan'
      : mappedError?.code === 'ERR_PLAN_RESTRICTED'
        ? 'View Plans'
        : mappedError?.code === 'ERR_PENDING_PAYMENT'
          ? 'Go to Billing'
          : '';
  const actionsLockedForBilling = mappedError?.code === 'ERR_PENDING_PAYMENT';

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-8">
      <h1 className="text-2xl font-bold text-slate-900">Integrity Harness</h1>

      <section className="rounded-xl border border-slate-200 p-4 space-y-3">
        <h2 className="text-lg font-semibold">ROI Safe-Zone Gate</h2>
        <label htmlFor="baseline" className="text-sm text-slate-700">
          Baseline move-in rate: <span data-testid="baseline-value">{baseline.toFixed(1)}%</span>
        </label>
        <input
          id="baseline"
          data-testid="baseline-slider"
          type="range"
          min={guardrails.hardMin}
          max={guardrails.hardMax}
          step={0.5}
          value={baseline}
          onChange={(e) => setBaseline(Number(e.target.value))}
          className={`w-full ${outsideSafeZone ? 'accent-amber-500' : ''}`}
        />
        <p className="text-xs text-slate-500">
          Safe zone: {guardrails.safeMin}% - {guardrails.safeMax}%
        </p>
        {outsideSafeZone ? (
          <span
            data-testid="safe-zone-warning"
            className="inline-flex items-center rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800"
          >
            Custom Baseline Applied
          </span>
        ) : null}
      </section>

      <section className="rounded-xl border border-slate-200 p-4 space-y-3">
        <h2 className="text-lg font-semibold">Billing Entitlement Gate</h2>
        <div className="flex flex-wrap gap-2">
          <button
            data-testid="err-slot-limit"
            onClick={() => setErrorCode('ERR_SLOT_LIMIT')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            ERR_SLOT_LIMIT
          </button>
          <button
            data-testid="err-plan-restricted"
            onClick={() => setErrorCode('ERR_PLAN_RESTRICTED')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            ERR_PLAN_RESTRICTED
          </button>
          <button
            data-testid="err-pending-payment"
            onClick={() => setErrorCode('ERR_PENDING_PAYMENT')}
            className="rounded border border-slate-300 px-3 py-2 text-sm"
          >
            ERR_PENDING_PAYMENT
          </button>
        </div>
        <div data-testid="error-code" className="text-sm text-slate-700">
          Code: {mappedError?.code || 'NONE'}
        </div>
        {ctaLabel ? (
          <button data-testid="entitlement-cta" className="rounded bg-slate-900 text-white px-4 py-2 text-sm">
            {ctaLabel}
          </button>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            data-testid="assign-plan-action"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            disabled={actionsLockedForBilling}
          >
            Assign Plan
          </button>
          <button
            data-testid="upgrade-action"
            className="rounded border border-slate-300 px-3 py-2 text-sm"
            disabled={actionsLockedForBilling}
          >
            Upgrade
          </button>
        </div>
      </section>
    </div>
  );
};
