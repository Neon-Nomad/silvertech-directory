import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Users, Settings, LogOut, CreditCard, CheckCircle, AlertCircle, Zap } from 'lucide-react';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { MyFacilities } from './MyFacilities';
import { LeadsView } from './LeadsView';
import { Button } from '@/components/ui/Button';
import { PRICING_PLANS } from '@/src/config/pricing';

const OperatorDashboard: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'leads' | 'billing' | 'settings'>('overview');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);
  const [userProfile, setUserProfile] = useState<any>(null);

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
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900">Access Denied</h2>
          <p className="text-slate-600">Please log in to access the dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <LayoutDashboard className="text-primary-600" />
            Provider Portal
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <button
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'overview'
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>

          <button
            onClick={() => setActiveTab('facilities')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'facilities'
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Building2 className="w-5 h-5" />
            My Facilities
          </button>

          <button
            onClick={() => setActiveTab('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'leads'
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Users className="w-5 h-5" />
            Leads
          </button>

          <button
            onClick={() => setActiveTab('billing')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'billing'
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <CreditCard className="w-5 h-5" />
            Billing & Plan
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'settings'
              ? 'bg-primary-50 text-primary-700'
              : 'text-slate-600 hover:bg-slate-50'
              }`}
          >
            <Settings className="w-5 h-5" />
            Settings
          </button>
        </nav>

        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-sm">
              {user.email?.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium text-slate-900 truncate">{user.email}</p>
              <p className="text-xs text-slate-500">Operator</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white border-b border-slate-200 p-4 md:hidden flex items-center justify-between">
          <h1 className="text-lg font-bold text-slate-900">Provider Portal</h1>
          <button onClick={() => signOut()} className="text-slate-500">
            <LogOut className="w-5 h-5" />
          </button>
        </header>

        <main className="p-8">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Dashboard Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-sm text-slate-500 font-medium uppercase">Total Views</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">1,245</p>
                  <span className="text-green-600 text-sm font-medium flex items-center gap-1 mt-2">
                    +12% from last month
                  </span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-sm text-slate-500 font-medium uppercase">Active Leads</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">8</p>
                  <span className="text-green-600 text-sm font-medium flex items-center gap-1 mt-2">
                    3 new today
                  </span>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <p className="text-sm text-slate-500 font-medium uppercase">Profile Score</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">85%</p>
                  <span className="text-slate-500 text-sm font-medium mt-2">
                    Add photos to improve
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'facilities' && <MyFacilities />}
          {activeTab === 'leads' && <LeadsView />}

          {activeTab === 'billing' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Billing & Plans</h2>
                  <p className="text-slate-600">Manage your subscription and facility assignments.</p>
                </div>
                {userProfile?.stripe_customer_id && (
                  <Button variant="outline" onClick={handleManageBilling} className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Manage Payment Method
                  </Button>
                )}
              </div>

              {/* Current Plan Overview */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Current Subscription</h3>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-xl text-slate-900">
                        {PRICING_PLANS.find(p => p.id === (userProfile?.plan || 'free'))?.name}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${userProfile?.plan === 'free' || !userProfile?.plan
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-primary-100 text-primary-700'
                        }`}>
                        {userProfile?.status === 'active' ? 'Active' : 'Free Tier'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-600">
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">Facility Assignments</h3>
                  <p className="text-slate-600 mb-4 text-sm">
                    Assign your premium plan benefits to specific facilities. You have <strong>{userProfile?.facility_assignments_remaining}</strong> slots available.
                  </p>

                  <div className="space-y-3">
                    {facilities.map((facility) => {
                      const isAssigned = facility.assigned_plan_owner_id === user?.id;
                      return (
                        <div key={facility.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3">
                            <Building2 className={`w-5 h-5 ${isAssigned ? 'text-primary-600' : 'text-slate-400'}`} />
                            <div>
                              <p className="font-medium text-slate-900">{facility.name}</p>
                              <p className="text-xs text-slate-500">
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
                                // Logic to unassign would go here - for now just alert
                                alert("To unassign a facility, please contact support or downgrade your plan.");
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
                <h3 className="text-xl font-bold text-slate-900 mb-6">Available Plans</h3>
                <div className="grid md:grid-cols-3 gap-6">
                  {PRICING_PLANS.filter(p => p.id !== 'free').map((plan) => {
                    const isCurrentPlan = userProfile?.plan === plan.id;
                    return (
                      <div
                        key={plan.id}
                        className={`relative bg-white rounded-xl border p-6 flex flex-col ${isCurrentPlan ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-200'
                          }`}
                      >
                        {plan.popular && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            MOST POPULAR
                          </div>
                        )}

                        <div className="mb-4">
                          <h4 className="font-bold text-lg text-slate-900">{plan.name}</h4>
                          <div className="flex items-baseline gap-1 mt-2">
                            <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                            <span className="text-slate-500">/month</span>
                          </div>
                          <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-green-100 text-green-800 border border-green-200">
                            15-Day Free Trial
                          </div>
                          <p className="text-sm text-slate-600 mt-2">
                            Includes {plan.slotCount} facility {plan.slotCount === 1 ? 'profile' : 'profiles'}
                          </p>
                        </div>

                        <ul className="space-y-3 mb-8 flex-1">
                          {plan.features.slice(0, 5).map((feature, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                              <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>

                        {isCurrentPlan ? (
                          <Button disabled className="w-full bg-slate-100 text-slate-500 border-slate-200">
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
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Account Settings</h2>
              <p className="text-slate-600">Manage your account preferences and notifications here.</p>
              {/* Placeholder for settings */}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default OperatorDashboard;
