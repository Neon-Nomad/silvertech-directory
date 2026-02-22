import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  LifeBuoy
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { MyFacilities } from './MyFacilities';
import { LeadsView } from './LeadsView';
import { OperatorQA } from './OperatorQA';
import { Button } from '@/components/ui/Button';
import { PRICING_PLANS } from '@/src/config/pricing';
import { DashboardTab, dashboardPathForTab, normalizeDashboardTab } from '@/src/utils/dashboardRouting';
import { BillingUiError, entitlementErrorCtaMap, parseEntitlementError } from '@/src/utils/billingErrors';
import { HelpCenter } from './HelpCenter';
import { HelpRouteKey } from '@/src/types/helpRegistry';
import { DashboardOverview } from './DashboardOverview';
import { BillingPlansView } from './BillingPlansView';
import { FacilityLineageView } from './FacilityLineageView';
import { trackActivationEvent } from '@/src/config/activationEvents';
import { getActivationSessionId } from '@/src/utils/activationSession';

const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tab } = useParams<{ tab?: string }>();
  const { user, signOut, loading } = useAuth();
  const [highlightQuestionId, setHighlightQuestionId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [ownedFacilityCount, setOwnedFacilityCount] = useState<number | null>(null);
  const [ownedFacilityCountLoading, setOwnedFacilityCountLoading] = useState(false);
  const [hasPendingClaim, setHasPendingClaim] = useState(false);
  const [pendingClaimLoading, setPendingClaimLoading] = useState(false);
  const [billingUiError, setBillingUiError] = useState<BillingUiError | null>(null);
  const [showContextHelp, setShowContextHelp] = useState(false);
  const [showPlanPeek, setShowPlanPeek] = useState(false);
  const planPeekTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeTab: DashboardTab = normalizeDashboardTab(tab) || 'overview';
  const helpRouteByTab: Record<DashboardTab, HelpRouteKey> = {
    overview: 'dashboard_overview',
    listings: 'dashboard_listings',
    leads: 'dashboard_leads',
    qa: 'dashboard_qa',
    billing: 'dashboard_billing',
    vault: 'dashboard_help',
    help: 'dashboard_help',
  };

  useEffect(() => {
    const questionId = searchParams.get('question_id');
    if (!questionId) {
      setHighlightQuestionId(null);
      return;
    }

    setHighlightQuestionId(questionId);
    if (activeTab !== 'qa') {
      navigate(`/dashboard/qa?question_id=${encodeURIComponent(questionId)}`, { replace: true });
    }
  }, [activeTab, navigate, searchParams]);

  const goToTab = (nextTab: DashboardTab) => {
    navigate(dashboardPathForTab(nextTab));
  };

  useEffect(() => {
    if (activeTab === 'billing' && user) {
      fetchBillingInfo();
    }
  }, [activeTab, user]);

  useEffect(() => {
    if (activeTab !== 'billing' && billingUiError) {
      setBillingUiError(null);
    }
  }, [activeTab, billingUiError]);

  useEffect(() => {
    setShowContextHelp(false);
  }, [activeTab]);

  const clearPlanPeekTimer = () => {
    if (!planPeekTimerRef.current) return;
    clearTimeout(planPeekTimerRef.current);
    planPeekTimerRef.current = null;
  };

  useEffect(() => () => clearPlanPeekTimer(), []);

  const currentPlan = PRICING_PLANS.find((plan) => plan.id === (userProfile?.plan || 'free'));
  const currentPlanName = currentPlan?.name || 'Free Listing';
  const normalizedBillingStatus = String(userProfile?.billing_status || userProfile?.status || '').toLowerCase();
  const isPaidPlan = Boolean(userProfile?.plan && userProfile?.plan !== 'free');
  const planStatusLabel = ['active', 'trialing', 'past_due'].includes(normalizedBillingStatus)
    ? 'Active'
    : isPaidPlan
      ? 'Manual Access'
      : 'Free Tier';

  const handleUserPlanPeek = () => {
    clearPlanPeekTimer();
    setShowPlanPeek(true);
    planPeekTimerRef.current = setTimeout(() => {
      setShowPlanPeek(false);
      planPeekTimerRef.current = null;
    }, 900);
  };

  const hideUserPlanPeek = () => {
    clearPlanPeekTimer();
    setShowPlanPeek(false);
  };

  useEffect(() => {
    if (!user || activeTab !== 'overview') return;
    trackActivationEvent('operator_activation_screen_viewed', {
      operator_id: user.id,
      facility_id: 'unknown',
      session_id: getActivationSessionId(),
      plan_tier: 'unknown',
      activation_score: 0,
      source_screen: 'dashboard_overview',
    });
  }, [activeTab, user]);

  useEffect(() => {
    let mounted = true;
    const loadUserProfile = async () => {
      if (!user) {
        if (mounted) {
          setUserProfile(null);
          setFacilities([]);
        }
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        if (mounted) setUserProfile(profile);
      } catch (err) {
        console.error('Error loading user profile:', err);
      }
    };

    void loadUserProfile();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const loadOwnedFacilityCount = async () => {
      if (!user) {
        if (mounted) {
          setOwnedFacilityCount(null);
          setOwnedFacilityCountLoading(false);
        }
        return;
      }

      setOwnedFacilityCountLoading(true);
      try {
        const { count, error } = await supabase
          .from('facilities')
          .select('id', { head: true, count: 'exact' })
          .eq('owner_id', user.id);
        if (error) throw error;
        if (mounted) setOwnedFacilityCount(count ?? 0);
      } catch (err) {
        console.error('Failed to load owned facility count:', err);
        if (mounted) setOwnedFacilityCount(0);
      } finally {
        if (mounted) setOwnedFacilityCountLoading(false);
      }
    };

    loadOwnedFacilityCount();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;
    const loadPendingClaimState = async () => {
      if (!user) {
        if (mounted) {
          setHasPendingClaim(false);
          setPendingClaimLoading(false);
        }
        return;
      }

      setPendingClaimLoading(true);
      try {
        const { count, error } = await supabase
          .from('facility_claims')
          .select('id', { head: true, count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'pending');
        if (error) throw error;
        if (mounted) setHasPendingClaim((count ?? 0) > 0);
      } catch (err) {
        console.error('Failed to load pending claim state:', err);
        if (mounted) setHasPendingClaim(false);
      } finally {
        if (mounted) setPendingClaimLoading(false);
      }
    };

    loadPendingClaimState();
    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user || ownedFacilityCountLoading || pendingClaimLoading) return;
    if (ownedFacilityCount === 0 && !hasPendingClaim && activeTab === 'overview') {
      const oncePerSessionKey = `std_claim_onboarding_redirected_${user.id}`;
      if (typeof window !== 'undefined' && window.sessionStorage.getItem(oncePerSessionKey) === '1') {
        return;
      }
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(oncePerSessionKey, '1');
      }
      navigate('/dashboard/listings?onboarding=claim', { replace: true });
    }
  }, [activeTab, hasPendingClaim, navigate, ownedFacilityCount, ownedFacilityCountLoading, pendingClaimLoading, user]);

  const fetchBillingInfo = async () => {
    try {
      // Fetch user's facilities
      const { data: facilitiesData, error: facilitiesError } = await supabase
        .from('facilities')
        .select('id, name, assigned_plan_owner_id')
        .eq('owner_id', user?.id);

      if (facilitiesError) throw facilitiesError;
      setFacilities(facilitiesData || []);
    } catch (err) {
      console.error("Error fetching billing info:", err);
    }
  };

  const handleUpgrade = async (stripePriceId: string) => {
    const plan = PRICING_PLANS.find(p => p.stripePriceId === stripePriceId);
    if (plan?.paymentLink) {
      window.location.href = plan.paymentLink;
    }
  };

  const handleManageBilling = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: {
          returnUrl: window.location.href,
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error creating portal session:", err);
      const mapped = parseEntitlementError(err);
      if (mapped) {
        setBillingUiError(mapped);
      } else {
        setBillingUiError({
          code: 'ERR_PLAN_RESTRICTED',
          message: 'Unable to open billing portal right now. Please try again.',
        });
      }
    }
  };

  const handleBillingErrorCta = (code: BillingUiError['code']) => {
    const cta = entitlementErrorCtaMap[code];
    if (!cta) return;
    if (cta.action === 'billing') {
      handleManageBilling();
      return;
    }
    document.getElementById('upgrade-plans')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleUnassignFacility = async (facilityId: string) => {
    try {
      const { error } = await supabase
        .from('facilities')
        .update({ assigned_plan_owner_id: null })
        .eq('id', facilityId)
        .eq('assigned_plan_owner_id', user?.id);

      if (error) throw error;
      setBillingUiError(null);
      await fetchBillingInfo();
    } catch (err) {
      console.error("Error unassigning facility:", err);
      const mapped = parseEntitlementError(err);
      if (mapped) {
        setBillingUiError(mapped);
      } else {
        setBillingUiError({
          code: 'ERR_PLAN_RESTRICTED',
          message: 'Failed to unassign facility. Please try again.',
        });
      }
    }
  };

  const handleAssignFacility = async (facilityId: string) => {
    if (!userProfile?.facility_assignments_remaining || userProfile.facility_assignments_remaining <= 0) {
      setBillingUiError({
        code: 'ERR_SLOT_LIMIT',
        message: `You've reached your limit for the current plan.`,
      });
      return;
    }

    try {
      const newRemaining = userProfile.facility_assignments_remaining - 1;
      setUserProfile({ ...userProfile, facility_assignments_remaining: newRemaining });

      const { error } = await supabase
        .from('facilities')
        .update({ assigned_plan_owner_id: user?.id })
        .eq('id', facilityId);

      if (error) throw error;

      setFacilities((prev) => prev.map((f) => (f.id === facilityId ? { ...f, assigned_plan_owner_id: user?.id } : f)));
      setBillingUiError(null);
      await fetchBillingInfo();
    } catch (err) {
      console.error("Error assigning facility:", err);
      const mapped = parseEntitlementError(err);
      if (mapped) {
        setBillingUiError(mapped);
      } else {
        setBillingUiError({
          code: 'ERR_PLAN_RESTRICTED',
          message: 'Failed to assign facility. Please try again.',
        });
      }
      await fetchBillingInfo();
    }
  };

  const handleCompleteProfileSetup = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id')
        .eq('owner_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (data?.id) {
        navigate(`/dashboard/facility/${data.id}/edit`);
        return;
      }
    } catch (err) {
      console.error('Failed to route to facility edit from dashboard setup CTA:', err);
    }

    goToTab('listings');
  };


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-charcoal">Access Denied</h2>
          <p className="text-charcoal/70">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-warm-white">
      <Helmet>
        <title>Operator Dashboard | SilverTech Directory</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href="https://silvertechdirectory.com/dashboard" />
      </Helmet>
      <header className="bg-white border-b border-warm-gray">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="SilverTech" className="h-11 w-auto" />
              <div>
                <p className="text-xs text-charcoal/40 leading-none">Operator Portal</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-charcoal/70">
              <button
                onClick={() => goToTab('overview')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'overview'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => goToTab('listings')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'listings'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Listings
              </button>
              <button
                onClick={() => goToTab('leads')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'leads'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Leads
              </button>
              <button
                onClick={() => goToTab('qa')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'qa'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Q&A
              </button>
              <button
                onClick={() => goToTab('billing')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'billing'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Billing
              </button>
              <button
                onClick={() => goToTab('vault')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'vault'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Vault
              </button>
              <button
                onClick={() => goToTab('help')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'help'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Help
              </button>
            </nav>

            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <label htmlFor="dashboard-tab-select" className="sr-only">
                  Dashboard section
                </label>
                <select
                  id="dashboard-tab-select"
                  value={activeTab}
                  onChange={(e) => goToTab(e.target.value as DashboardTab)}
                  className="min-h-11 rounded-md border border-warm-gray bg-white px-3 py-2 text-sm text-charcoal"
                >
                  <option value="overview">Dashboard</option>
                  <option value="listings">Listings</option>
                  <option value="leads">Leads</option>
                  <option value="qa">Q&A</option>
                  <option value="billing">Billing</option>
                  <option value="vault">Vault</option>
                  <option value="help">Help</option>
                </select>
              </div>
              <div
                className="hidden sm:flex items-center gap-3 relative"
                onMouseEnter={handleUserPlanPeek}
                onMouseLeave={hideUserPlanPeek}
              >
                <div className="w-9 h-9 rounded-full bg-warm-gray flex items-center justify-center text-charcoal text-sm font-bold">
                  {user.email?.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-sm">
                  <p className="text-charcoal leading-none truncate max-w-[220px] lg:max-w-[280px]" title={user.email || ''}>{user.email}</p>
                  <p className="text-xs text-charcoal/40 leading-none">Operator</p>
                </div>
                {showPlanPeek && (
                  <div className="pointer-events-none absolute right-0 top-full mt-2 z-20 rounded-md border border-warm-gray bg-white px-3 py-2 text-xs text-charcoal shadow-lg whitespace-nowrap">
                    <span className="font-semibold">{currentPlanName}</span>
                    <span className="ml-2 text-charcoal/60">{planStatusLabel}</span>
                  </div>
                )}
              </div>
              <button
                onClick={() => signOut()}
                className="text-sm font-medium text-charcoal/70 hover:text-charcoal"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
          <h1 className="sr-only">Operator Dashboard</h1>
          {activeTab === 'overview' && (
            <DashboardOverview
              userProfile={userProfile}
              onGoToListings={() => goToTab('listings')}
              onCompleteProfileSetup={handleCompleteProfileSetup}
              onGoToLeads={() => goToTab('leads')}
              onViewPublicProfile={() => navigate('/search')}
            />
          )}

          {activeTab === 'listings' && <MyFacilities />}
          {activeTab === 'leads' && <LeadsView />}
          {activeTab === 'qa' && <OperatorQA highlightQuestionId={highlightQuestionId} />}

          {activeTab === 'billing' && (
            <BillingPlansView
              userId={user.id}
              userProfile={userProfile}
              facilities={facilities}
              billingUiError={billingUiError}
              onManageBilling={handleManageBilling}
              onBillingErrorCta={handleBillingErrorCta}
              onUpgrade={handleUpgrade}
              onAssignFacility={handleAssignFacility}
              onUnassignFacility={handleUnassignFacility}
            />
          )}

          {activeTab === 'vault' && <FacilityLineageView />}

          {activeTab === 'help' && (
            <div className="space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-charcoal">Help Center</h2>
                  <p className="text-charcoal/70">Guides, troubleshooting, and policies for operators.</p>
                </div>
                <div className="hidden sm:flex items-center gap-2 rounded-full border border-warm-gray bg-white px-4 py-2 text-sm text-charcoal/70">
                  <LifeBuoy className="h-4 w-4" />
                  Context-aware support
                </div>
              </div>
              <HelpCenter routeKey={helpRouteByTab[activeTab]} />
            </div>
          )}

      </main>

      {activeTab !== 'help' && (
        <>
          <button
            type="button"
            aria-label="Open contextual help"
            onClick={() => setShowContextHelp(true)}
            className="fixed bottom-6 right-6 z-40 inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-slate-800"
          >
            <LifeBuoy className="h-4 w-4" />
            Help
          </button>

          {showContextHelp && (
            <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Contextual help panel">
              <button
                type="button"
                aria-label="Close help panel"
                className="absolute inset-0 bg-slate-900/50"
                onClick={() => setShowContextHelp(false)}
              />
              <div className="absolute right-0 top-0 h-full w-full max-w-2xl overflow-y-auto border-l border-warm-gray bg-warm-white p-6 shadow-2xl">
                <div className="mb-4 flex items-center justify-between border-b border-warm-gray pb-3">
                  <h2 className="text-lg font-semibold text-charcoal">Contextual Help</h2>
                  <button
                    type="button"
                    className="min-h-11 rounded-md px-3 text-sm font-medium text-charcoal/70 hover:bg-warm-gray hover:text-charcoal"
                    onClick={() => setShowContextHelp(false)}
                  >
                    Close
                  </button>
                </div>
                <HelpCenter routeKey={helpRouteByTab[activeTab]} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default OperatorDashboard;
