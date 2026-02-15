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

const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { tab } = useParams<{ tab?: string }>();
  const { user, signOut, loading } = useAuth();
  const [highlightQuestionId, setHighlightQuestionId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [billingUiError, setBillingUiError] = useState<BillingUiError | null>(null);
  const [showContextHelp, setShowContextHelp] = useState(false);
  const activeTab: DashboardTab = normalizeDashboardTab(tab) || 'overview';
  const helpRouteByTab: Record<DashboardTab, HelpRouteKey> = {
    overview: 'dashboard_overview',
    listings: 'dashboard_listings',
    leads: 'dashboard_leads',
    qa: 'dashboard_qa',
    billing: 'dashboard_billing',
    lineage: 'dashboard_help',
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

  const fetchBillingInfo = async () => {
    try {
      // Fetch user profile with billing info
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setUserProfile(profile);

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
                onClick={() => goToTab('lineage')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'lineage'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Lineage
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
                  <option value="lineage">Lineage</option>
                  <option value="help">Help</option>
                </select>
              </div>
              <div className="hidden sm:flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-warm-gray flex items-center justify-center text-charcoal text-sm font-bold">
                  {user.email?.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-sm">
                  <p className="text-charcoal leading-none truncate max-w-[140px]">{user.email}</p>
                  <p className="text-xs text-charcoal/40 leading-none">Operator</p>
                </div>
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
          {activeTab === 'overview' && (
            <DashboardOverview
              onGoToListings={() => goToTab('listings')}
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

          {activeTab === 'lineage' && <FacilityLineageView />}

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
