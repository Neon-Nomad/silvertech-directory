import React from 'react';
import { Building2, CheckCircle, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { PRICING_PLANS } from '@/src/config/pricing';
import { BillingUiError, entitlementErrorCtaMap } from '@/src/utils/billingErrors';

type FacilityRow = {
  id: string;
  name: string;
  assigned_plan_owner_id: string | null;
};

type BillingPlansViewProps = {
  userId: string;
  userProfile: any;
  facilities: FacilityRow[];
  billingUiError: BillingUiError | null;
  onManageBilling: () => void;
  onBillingErrorCta: (code: BillingUiError['code']) => void;
  onUpgrade: (stripePriceId: string) => void;
  onAssignFacility: (facilityId: string) => Promise<void>;
  onUnassignFacility: (facilityId: string) => Promise<void>;
};

export const BillingPlansView: React.FC<BillingPlansViewProps> = ({
  userId,
  userProfile,
  facilities,
  billingUiError,
  onManageBilling,
  onBillingErrorCta,
  onUpgrade,
  onAssignFacility,
  onUnassignFacility,
}) => {
  const actionsLockedForBilling = billingUiError?.code === 'ERR_PENDING_PAYMENT';
  const currentPlan = PRICING_PLANS.find((p) => p.id === (userProfile?.plan || 'free'));
  const currentPlanPrice = currentPlan?.price ?? 0;
  const slotCount = currentPlan?.slotCount || 0;
  const assignedCount = facilities.filter((f) => f.assigned_plan_owner_id === userId).length;
  const slotPercent = slotCount > 0 ? Math.min(100, Math.round((assignedCount / slotCount) * 100)) : 0;
  const normalizedBillingStatus = String(userProfile?.billing_status || userProfile?.status || '').toLowerCase();
  const isPaidPlan = Boolean(userProfile?.plan && userProfile.plan !== 'free');
  const hasStripeSubscription = Boolean(userProfile?.stripe_subscription_id || userProfile?.stripe_customer_id);
  const isActiveSubscription =
    ['active', 'trialing', 'past_due'].includes(normalizedBillingStatus) ||
    (isPaidPlan && hasStripeSubscription);
  const subscriptionBadgeLabel = isActiveSubscription ? 'Active' : isPaidPlan ? 'Manual Access' : 'Free Tier';
  const subscriptionBadgeClass = isPaidPlan
    ? 'bg-primary-100 text-primary-700'
    : 'bg-warm-gray text-charcoal/70';

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Billing & Plans</h2>
          <p className="text-charcoal/70">Manage your subscriptions, slot allocations, and premium benefits.</p>
        </div>
        {userProfile?.stripe_customer_id && (
          <Button variant="outline" onClick={onManageBilling} className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Manage Billing in Stripe
          </Button>
        )}
      </div>

      {billingUiError && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-amber-900">{billingUiError.message}</p>
              <p className="mt-0.5 text-xs text-amber-800">Code: {billingUiError.code}</p>
            </div>
            <Button size="sm" className="min-h-11" onClick={() => onBillingErrorCta(billingUiError.code)}>
              {entitlementErrorCtaMap[billingUiError.code].label}
            </Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-8 xl:grid-cols-3">
        <div className="space-y-8 xl:col-span-2">
          <div className="rounded-xl border border-warm-gray bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-charcoal">Current Subscription</h3>
            <div className="rounded-lg border border-warm-gray bg-warm-white p-4">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-bold text-charcoal">{currentPlan?.name || 'Free Listing'}</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${subscriptionBadgeClass}`}>
                    {subscriptionBadgeLabel}
                  </span>
                </div>
                <span className="text-sm text-charcoal/60">Next renewal: {userProfile?.current_period_end || 'N/A'}</span>
              </div>

              {slotCount > 0 ? (
                <div>
                  <div className="mb-2 flex items-center justify-between text-sm">
                    <span className="font-medium text-charcoal">Slot Management</span>
                    <span className="rounded border border-warm-gray bg-white px-2 py-1 font-mono text-xs">
                      {assignedCount} / {slotCount} slots used
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-warm-gray">
                    <div className="h-2 rounded-full bg-primary-600" style={{ width: `${slotPercent}%` }} />
                  </div>
                  <p className="mt-2 text-sm text-charcoal/70">
                    {Math.max((userProfile?.facility_assignments_remaining ?? slotCount - assignedCount), 0)} slots remaining
                  </p>
                </div>
              ) : (
                <p className="text-sm text-charcoal/70">Upgrade to unlock assignable facility slots.</p>
              )}
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-warm-gray bg-white shadow-sm">
            <div className="border-b border-warm-gray px-6 py-4">
              <h3 className="text-lg font-bold text-charcoal">Assign Benefits</h3>
            </div>
            <div className="divide-y divide-warm-gray md:hidden">
              {facilities.map((facility) => {
                const isAssigned = facility.assigned_plan_owner_id === userId;
                return (
                  <div key={`card-${facility.id}`} className="space-y-3 px-4 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <Building2 className={`h-4 w-4 ${isAssigned ? 'text-primary-600' : 'text-charcoal/40'}`} />
                        <span className="font-medium text-charcoal">{facility.name}</span>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          isAssigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {isAssigned ? 'Active' : 'Basic'}
                      </span>
                    </div>
                    <div className="flex justify-end">
                      {isAssigned ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-11 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                          onClick={() => void onUnassignFacility(facility.id)}
                          disabled={actionsLockedForBilling}
                        >
                          Unassign
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="min-h-11"
                          onClick={() => void onAssignFacility(facility.id)}
                          disabled={actionsLockedForBilling}
                        >
                          Assign Plan
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="overflow-x-auto">
              <table className="hidden w-full text-sm md:table">
                <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-charcoal/60">
                  <tr>
                    <th className="px-6 py-3">Facility Name</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Apply Premium Features</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-gray">
                  {facilities.map((facility) => {
                    const isAssigned = facility.assigned_plan_owner_id === userId;
                    return (
                      <tr key={facility.id}>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Building2 className={`h-4 w-4 ${isAssigned ? 'text-primary-600' : 'text-charcoal/40'}`} />
                            <span className="font-medium text-charcoal">{facility.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              isAssigned ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {isAssigned ? 'Active' : 'Basic'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAssigned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => void onUnassignFacility(facility.id)}
                              disabled={actionsLockedForBilling}
                            >
                              Unassign
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => void onAssignFacility(facility.id)}
                              disabled={actionsLockedForBilling}
                            >
                              Assign Plan
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl bg-charcoal p-6 text-white shadow-lg">
            <h3 className="mb-4 text-lg font-bold">Plan Comparison</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>Monthly Slots</span>
                <span className="font-semibold text-primary-300">1 / 3 / 10 / 25</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>Search Ranking</span>
                <span className="font-semibold">Normal -&gt; Priority</span>
              </div>
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span>Lead Analytics</span>
                <span className="font-semibold">Basic -&gt; Advanced</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Direct Inquiries</span>
                <CheckCircle className="h-4 w-4 text-primary-300" />
              </div>
            </div>
          </div>

          <div id="upgrade-plans" className="space-y-4">
            <h3 className="text-lg font-bold text-charcoal">Available Plans</h3>
            {PRICING_PLANS.filter((p) => p.id !== 'free').map((plan) => {
              const isCurrentPlan = userProfile?.plan === plan.id;
              const isLowerOrEqualTier = plan.price <= currentPlanPrice;
              return (
                <div key={plan.id} className="rounded-xl border border-warm-gray bg-white p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-charcoal">{plan.name}</p>
                    <p className="text-sm font-bold text-charcoal">{plan.priceLabel}</p>
                  </div>
                  <p className="mb-3 text-xs text-charcoal/60">
                    Includes {plan.slotCount} facility {plan.slotCount === 1 ? 'slot' : 'slots'}
                  </p>
                  <ul className="mb-3 space-y-1 text-xs text-charcoal/70">
                    {plan.features.slice(0, 3).map((feature, idx) => (
                      <li key={`${plan.id}-${idx}`} className="flex items-start gap-1">
                        <CheckCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {isCurrentPlan ? (
                    <Button disabled className="w-full border-warm-gray bg-warm-gray text-charcoal/60">
                      Current Plan
                    </Button>
                  ) : isLowerOrEqualTier ? (
                    <Button disabled variant="outline" className="w-full border-warm-gray text-charcoal/60">
                      Included in your plan
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.popular ? 'primary' : 'outline'}
                      onClick={() => onUpgrade(plan.stripePriceId)}
                      disabled={actionsLockedForBilling}
                    >
                      Upgrade
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
