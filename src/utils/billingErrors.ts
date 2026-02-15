export type EntitlementErrorCode = 'ERR_SLOT_LIMIT' | 'ERR_PLAN_RESTRICTED' | 'ERR_PENDING_PAYMENT';

export type BillingUiError = {
  code: EntitlementErrorCode;
  message: string;
};

export type BillingErrorCta = {
  label: 'Upgrade Plan' | 'View Plans' | 'Go to Billing';
  action: 'upgrade' | 'plans' | 'billing';
};

export const entitlementErrorCtaMap: Record<EntitlementErrorCode, BillingErrorCta> = {
  ERR_SLOT_LIMIT: { label: 'Upgrade Plan', action: 'upgrade' },
  ERR_PLAN_RESTRICTED: { label: 'View Plans', action: 'plans' },
  ERR_PENDING_PAYMENT: { label: 'Go to Billing', action: 'billing' },
};

export const parseEntitlementError = (rawError: unknown): BillingUiError | null => {
  const raw = rawError as { code?: string; message?: string } | null | undefined;
  const code = String(raw?.code || '').toUpperCase();
  const message = String(raw?.message || '');
  const msgUpper = message.toUpperCase();

  if (code === 'ERR_SLOT_LIMIT' || msgUpper.includes('ERR_SLOT_LIMIT')) {
    return {
      code: 'ERR_SLOT_LIMIT',
      message: `You've reached your limit for the current plan.`,
    };
  }

  if (code === 'ERR_PLAN_RESTRICTED' || msgUpper.includes('ERR_PLAN_RESTRICTED')) {
    return {
      code: 'ERR_PLAN_RESTRICTED',
      message: 'This feature requires a higher subscription plan.',
    };
  }

  if (code === 'ERR_PENDING_PAYMENT' || msgUpper.includes('ERR_PENDING_PAYMENT')) {
    return {
      code: 'ERR_PENDING_PAYMENT',
      message: 'Action disabled due to an outstanding balance.',
    };
  }

  return null;
};
