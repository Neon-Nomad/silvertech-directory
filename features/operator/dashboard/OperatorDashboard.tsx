import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Settings,
  LogOut,
  CreditCard,
  CheckCircle,
  Phone,
  Mail,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { MyFacilities } from './MyFacilities';
import { LeadsView } from './LeadsView';
import { OperatorQA } from './OperatorQA';
import { Button } from '@/components/ui/Button';
import { PRICING_PLANS } from '@/src/config/pricing';

const OperatorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'leads' | 'qa' | 'billing' | 'settings'>('overview');
  const [highlightQuestionId, setHighlightQuestionId] = useState<string | null>(null);
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    const requestedTab = searchParams.get('tab');
    const questionId = searchParams.get('question_id');

    if (questionId) {
      setActiveTab('qa');
      setHighlightQuestionId(questionId);
      return;
    }

    if (requestedTab === 'qa') {
      setActiveTab('qa');
      setHighlightQuestionId(null);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === 'billing' && user) {
      fetchBillingInfo();
    }
  }, [activeTab, user]);

  const fetchBillingInfo = async () => {
    setLoadingBilling(true);
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
    } finally {
      setLoadingBilling(false);
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
      alert("Failed to open billing portal. Please try again or contact support.");
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
              <div className="w-9 h-9 rounded-full bg-charcoal text-white flex items-center justify-center font-bold">
                ST
              </div>
              <div>
                <p className="text-sm text-charcoal/60 leading-none">SilverTech</p>
                <p className="text-xs text-charcoal/40 leading-none">Operator Portal</p>
              </div>
            </div>

            <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-charcoal/70">
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'overview'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveTab('facilities')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'facilities'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Listings
              </button>
              <button
                onClick={() => setActiveTab('leads')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'leads'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Leads
              </button>
              <button
                onClick={() => setActiveTab('qa')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'qa'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Q&A
              </button>
              <button
                onClick={() => setActiveTab('overview')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'overview'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Analytics
              </button>
              <button
                onClick={() => setActiveTab('billing')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'billing'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Billing
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`pb-1 border-b-2 transition-colors ${activeTab === 'settings'
                  ? 'text-charcoal border-slate-900'
                  : 'border-transparent hover:text-charcoal'
                  }`}
              >
                Settings
              </button>
            </nav>

            <div className="flex items-center gap-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <section className="lg:col-span-4 space-y-6">
                <div className="bg-white rounded-2xl border border-warm-gray shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-charcoal mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    <button
                      onClick={() => navigate('/search')}
                      className="w-full bg-charcoal text-white py-3 rounded-full font-medium flex items-center justify-center gap-2"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      View Public Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('facilities')}
                      className="w-full bg-charcoal/80 text-white py-3 rounded-full font-medium flex items-center justify-center gap-2"
                    >
                      <Building2 className="w-4 h-4" />
                      Edit Listing
                    </button>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-warm-gray shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-charcoal">Premium Benefits</h2>
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center text-primary-600">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="space-y-3 text-sm text-charcoal/70">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gold" />
                      Featured placement in results
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gold" />
                      Enhanced visibility across the directory
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-gold" />
                      Priority support for family inquiries
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-warm-gray shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-charcoal">Lead Attribution</h2>
                    <span className="text-xs text-charcoal/40">Last 30 days</span>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: 'Google', value: 18 },
                      { label: 'SilverTech', value: 12 },
                      { label: 'Direct Link', value: 9 },
                      { label: 'Referral', value: 6 }
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="flex items-center justify-between text-sm text-charcoal/70">
                          <span>{item.label}</span>
                          <span className="font-semibold text-charcoal">{item.value}</span>
                        </div>
                        <div className="h-2 bg-warm-gray rounded-full mt-2">
                          <div
                            className="h-2 rounded-full bg-charcoal/90"
                            style={{ width: `${(item.value / 20) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <section className="lg:col-span-8 space-y-6">
                <div className="bg-white rounded-2xl border border-warm-gray shadow-sm p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-charcoal/60">
                        Your listing is performing better than 68% of homes in your area.
                      </p>
                      <h2 className="text-lg font-semibold text-charcoal mt-1">Performance Overview</h2>
                    </div>
                    <div className="text-xs text-charcoal/60 flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      Updated today
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4 mt-5">
                    {[
                      { label: 'Profile Views', value: '1,250' },
                      { label: 'Leads Received', value: '45' },
                      { label: 'Estimated Move-Ins', value: '3' },
                      { label: 'Estimated Revenue', value: '$18,000' },
                      { label: 'Avg. Response Time', value: '1h 12m' }
                    ].map((stat) => (
                      <div key={stat.label} className="border border-warm-gray rounded-xl p-4 text-center">
                        <p className="text-xs text-charcoal/60 uppercase">{stat.label}</p>
                        <p className="text-2xl font-semibold text-charcoal mt-2">{stat.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-warm-gray shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-charcoal">Recent Leads</h2>
                    <button onClick={() => setActiveTab('leads')} className="text-sm text-charcoal/60 hover:text-charcoal">View all</button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-charcoal/60 border-b border-warm-gray">
                          <th className="py-2">Name</th>
                          <th className="py-2">Date</th>
                          <th className="py-2">Inquiry Type</th>
                          <th className="py-2">Status</th>
                          <th className="py-2 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="text-charcoal">
                        {[
                          { name: 'Jona Smith', date: '03/22/2023', type: 'Inquiry Form', status: 'New', phone: '(555) 555-0111', email: 'jona@example.com' },
                          { name: 'John Anthrena', date: '03/22/2023', type: 'Inquiry Form', status: 'Contacted', phone: '(555) 555-0112', email: 'john@example.com' },
                          { name: 'Barky Jason', date: '03/22/2023', type: 'Inquiry Form', status: 'Follow-up', phone: '(555) 555-0113', email: 'barky@example.com' }
                        ].map((lead) => (
                          <tr key={lead.name} className="border-b border-warm-gray">
                            <td className="py-3 font-medium">{lead.name}</td>
                            <td className="py-3">{lead.date}</td>
                            <td className="py-3">{lead.type}</td>
                            <td className="py-3">
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-warm-gray text-charcoal">
                                {lead.status}
                              </span>
                            </td>
                            <td className="py-3">
                              <div className="flex items-center justify-end gap-2">
                                <a
                                  href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                                  className="w-8 h-8 rounded-full bg-charcoal text-white flex items-center justify-center"
                                >
                                  <Phone className="w-4 h-4" />
                                </a>
                                <a
                                  href={`mailto:${lead.email}`}
                                  className="w-8 h-8 rounded-full bg-charcoal/80 text-white flex items-center justify-center"
                                >
                                  <Mail className="w-4 h-4" />
                                </a>
                                <a
                                  href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                                  className="px-4 py-1 rounded-full bg-charcoal text-white text-xs font-medium"
                                >
                                  Call
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-warm-gray shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-charcoal/60" />
                      <h2 className="text-lg font-semibold text-charcoal">Analytics</h2>
                    </div>
                    <select className="border border-warm-gray rounded-full px-3 py-1 text-sm text-charcoal/70">
                      <option>Past month</option>
                      <option>Past 3 months</option>
                      <option>Past year</option>
                    </select>
                  </div>
                  <div className="h-48 bg-warm-white rounded-xl border border-dashed border-warm-gray relative overflow-hidden">
                    <svg viewBox="0 0 600 200" className="absolute inset-0 w-full h-full">
                      <path
                        d="M0 160 C80 120, 140 120, 200 140 C260 160, 320 60, 380 80 C440 100, 520 40, 600 70"
                        fill="none"
                        stroke="#2D2D2D"
                        strokeWidth="3"
                      />
                      <path
                        d="M0 160 C80 120, 140 120, 200 140 C260 160, 320 60, 380 80 C440 100, 520 40, 600 70 L600 200 L0 200 Z"
                        fill="rgba(45, 45, 45, 0.08)"
                      />
                    </svg>
                  </div>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'facilities' && <MyFacilities />}
          {activeTab === 'leads' && <LeadsView />}
          {activeTab === 'qa' && <OperatorQA highlightQuestionId={highlightQuestionId} />}

          {activeTab === 'billing' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-charcoal">Billing & Plans</h2>
                  <p className="text-charcoal/70">Manage your subscription and facility assignments.</p>
                </div>
                {userProfile?.stripe_customer_id && (
                  <Button variant="outline" onClick={handleManageBilling} className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Manage Payment Method
                  </Button>
                )}
              </div>

              {/* Current Plan Overview */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-gray">
                <h3 className="text-lg font-bold text-charcoal mb-4">Current Subscription</h3>
                <div className="flex items-center justify-between p-4 bg-warm-white rounded-lg border border-warm-gray">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xl text-charcoal">
                        {PRICING_PLANS.find(p => p.id === (userProfile?.plan || 'free'))?.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${userProfile?.plan === 'free' || !userProfile?.plan
                        ? 'bg-warm-gray text-charcoal/70'
                        : 'bg-primary-100 text-primary-700'
                        }`}>
                        {userProfile?.status === 'active' ? 'Active' : 'Free Tier'}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/70">
                      {userProfile?.facility_assignments_remaining || 0} facility assignments remaining
                    </p>
                  </div>
                  {userProfile?.plan !== 'lead_suite' && (
                    <Button onClick={() => document.getElementById('upgrade-plans')?.scrollIntoView({ behavior: 'smooth' })}>
                      Upgrade Plan
                    </Button>
                  )}
                </div>
              </div>

              {/* Facility Assignments */}
              {userProfile?.plan !== 'free' && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-warm-gray">
                  <h3 className="text-lg font-bold text-charcoal mb-4">Facility Assignments</h3>
                  <p className="text-charcoal/70 mb-4 text-sm">
                    Assign your premium plan benefits to specific facilities. You have <strong>{userProfile?.facility_assignments_remaining}</strong> slots available.
                  </p>

                  <div className="space-y-3">
                    {facilities.map((facility) => {
                      const isAssigned = facility.assigned_plan_owner_id === user?.id;
                      return (
                        <div key={facility.id} className="flex items-center justify-between p-4 border border-warm-gray rounded-lg hover:bg-warm-white transition-colors">
                          <div className="flex items-center gap-3">
                            <Building2 className={`w-5 h-5 ${isAssigned ? 'text-primary-600' : 'text-charcoal/40'}`} />
                            <div>
                              <p className="font-medium text-charcoal">{facility.name}</p>
                              <p className="text-xs text-charcoal/60">
                                {isAssigned ? 'Premium benefits active' : 'Basic listing'}
                              </p>
                            </div>
                          </div>

                          {isAssigned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                              onClick={async () => {
                                try {
                                  const { error } = await supabase
                                    .from('facilities')
                                    .update({ assigned_plan_owner_id: null })
                                    .eq('id', facility.id)
                                    .eq('assigned_plan_owner_id', user?.id);

                                  if (error) throw error;
                                  await fetchBillingInfo();
                                } catch (err) {
                                  console.error("Error unassigning facility:", err);
                                  alert("Failed to unassign facility. Please try again.");
                                }
                              }}
                            >
                              Unassign
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              disabled={!userProfile?.facility_assignments_remaining || userProfile.facility_assignments_remaining <= 0}
                              onClick={async () => {
                                if (!userProfile?.facility_assignments_remaining) return;
                                try {
                                  // Optimistic update
                                  const newRemaining = userProfile.facility_assignments_remaining - 1;
                                  setUserProfile({ ...userProfile, facility_assignments_remaining: newRemaining });

                                  // Update facility
                                  const { error } = await supabase
                                    .from('facilities')
                                    .update({ assigned_plan_owner_id: user?.id })
                                    .eq('id', facility.id);

                                  if (error) throw error;

                                  // Update local facilities state
                                  setFacilities(facilities.map(f => f.id === facility.id ? { ...f, assigned_plan_owner_id: user?.id } : f));

                                  // Update profile remaining count in DB (handled by trigger usually, but good to sync)
                                  await fetchBillingInfo();

                                } catch (err) {
                                  console.error("Error assigning facility:", err);
                                  alert("Failed to assign facility. Please try again.");
                                  await fetchBillingInfo(); // Revert optimistic update
                                }
                              }}
                            >
                              Assign Plan
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Available Plans */}
              <div id="upgrade-plans">
                <h3 className="text-xl font-bold text-charcoal mb-6">Available Plans</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {PRICING_PLANS.filter(p => p.id !== 'free').map((plan) => {
                    const isCurrentPlan = userProfile?.plan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`relative bg-white rounded-xl border p-6 flex flex-col ${isCurrentPlan ? 'border-primary-500 ring-1 ring-primary-500' : 'border-warm-gray'
                          }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            MOST POPULAR
                          </div>
                        )}

                        <div className="mb-4">
                          <h4 className="font-bold text-lg text-charcoal">{plan.name}</h4>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-3xl font-bold text-charcoal">${plan.price}</span>
                            <span className="text-charcoal/60">/month</span>
                          </div>
                          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary-100 text-primary-800 border border-primary-200">
                            15-Day Free Trial
                          </div>
                          <p className="text-sm text-charcoal/70 mt-2">
                            Includes {plan.slotCount} facility {plan.slotCount === 1 ? 'profile' : 'profiles'}
                          </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                          {plan.features.slice(0, 5).map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-charcoal/70">
                              <CheckCircle className="w-4 h-4 text-primary-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {isCurrentPlan ? (
                          <Button disabled className="w-full bg-warm-gray text-charcoal/60 border-warm-gray">
                            Current Plan
                          </Button>
                        ) : (
                          <Button
                            className="w-full"
                            variant={plan.popular ? 'primary' : 'outline'}
                            onClick={() => handleUpgrade(plan.stripePriceId)}
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
          )}

          {activeTab === 'settings' && (
            <div className="bg-white p-8 rounded-xl shadow-sm border border-warm-gray">
              <h2 className="text-2xl font-bold text-charcoal mb-4">Account Settings</h2>
              <p className="text-charcoal/70">Manage your account preferences and notifications here.</p>
              {/* Placeholder for settings */}
            </div>
          )}
      </main>
    </div>
  );
};

export default OperatorDashboard;
