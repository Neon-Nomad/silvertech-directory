import { describe, expect, it } from 'vitest';
import { entitlementErrorCtaMap, parseEntitlementError } from '@/src/utils/billingErrors';

describe('billing entitlement mapping', () => {
  it('maps ERR_SLOT_LIMIT to upgrade message', () => {
    const mapped = parseEntitlementError({ code: 'ERR_SLOT_LIMIT', message: 'limit hit' });
    expect(mapped?.code).toBe('ERR_SLOT_LIMIT');
  });

  it('maps ERR_PLAN_RESTRICTED to plan message', () => {
    const mapped = parseEntitlementError({ code: 'ERR_PLAN_RESTRICTED', message: 'blocked' });
    expect(mapped?.code).toBe('ERR_PLAN_RESTRICTED');
  });

  it('maps ERR_PENDING_PAYMENT from message when code missing', () => {
    const mapped = parseEntitlementError({ message: 'err_pending_payment: account balance' });
    expect(mapped?.code).toBe('ERR_PENDING_PAYMENT');
  });

  it('returns null for unknown errors', () => {
    expect(parseEntitlementError({ code: 'UNKNOWN' })).toBeNull();
  });

  it('maps entitlement codes to deterministic CTAs', () => {
    expect(entitlementErrorCtaMap.ERR_SLOT_LIMIT.label).toBe('Upgrade Plan');
    expect(entitlementErrorCtaMap.ERR_PLAN_RESTRICTED.label).toBe('View Plans');
    expect(entitlementErrorCtaMap.ERR_PENDING_PAYMENT.label).toBe('Go to Billing');
  });
});
