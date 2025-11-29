import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Building2, Users, Settings, LogOut, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/src/context/AuthProvider';
import { supabase } from '@/src/lib/supabase';
import { MyFacilities } from './MyFacilities';
import { LeadsView } from './LeadsView';
import { Button } from '@/components/ui/Button';

const OperatorDashboard: React.FC = () => {
  const { user, signOut, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'leads' | 'billing' | 'settings'>('overview');
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loadingBilling, setLoadingBilling] = useState(false);

  useEffect(() => {
    if (activeTab === 'billing' && user) {
      fetchBillingInfo();
    }
  }, [activeTab, user]);

  const fetchBillingInfo = async () => {
    setLoadingBilling(true);
    try {
      const { data, error } = await supabase
        .from('facilities')
        .select('id, name, plan, billing_status, stripe_customer_id')
        .eq('owner_id', user?.id);

      if (error) throw error;
      setFacilities(data || []);
    } catch (err) {
      console.error("Error fetching billing info:", err);
    } finally {
      setLoadingBilling(false);
    }
  };

  const handleUpgrade = async (facilityId: string) => {
    try {
      // Call Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: {
          facilityId,
          priceId: 'price_1SYqV5RvhVZKgAjoodrRn0Mk', // Premium Plan
          userId: user?.id,
          returnUrl: window.location.href, // Redirect back to current page
        }
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error("Error creating checkout session:", err);
      alert("Failed to start checkout. Please try again.");
    }
  };

  const handleManageBilling = async () => {
    // In a real app, this would call a function to create a portal session
    // For now, we'll just alert or link to a generic portal if we had one
    alert("To manage your subscription, please contact support or use the Stripe Customer Portal link sent to your email.");
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
            <div className="space-y-6">
              <h2 className="text-2xl font-bold text-slate-900">Billing & Plans</h2>
              <p className="text-slate-600">Manage your subscriptions and billing details.</p>

              {loadingBilling ? (
                <div>Loading billing info...</div>
              ) : (
                <div className="grid gap-6">
                  {facilities.map(facility => (
                    <div key={facility.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{facility.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm text-slate-500">Current Plan:</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                             ${facility.plan === 'featured' ? 'bg-purple-100 text-purple-800' :
                              facility.plan === 'lead_suite' ? 'bg-blue-100 text-blue-800' :
                                'bg-slate-100 text-slate-800'}`}>
                            {facility.plan || 'Basic'}
                          </span>
                          {facility.billing_status === 'active' && (
                            <span className="text-green-600 text-xs flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Active
                            </span>
                          )}
                          {facility.billing_status === 'past_due' && (
                            <span className="text-red-600 text-xs flex items-center gap-1">
                              <AlertCircle className="w-3 h-3" /> Past Due
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {facility.plan === 'basic' && (
                          <Button onClick={() => handleUpgrade(facility.id)} className="bg-purple-600 hover:bg-purple-700 text-white">
                            Upgrade to Featured ($99/mo)
                          </Button>
                        )}
                        {facility.plan === 'featured' && (
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={handleManageBilling}>
                              Manage Billing
                            </Button>
                            <Button variant="outline" onClick={() => window.location.href = '/providers/contact-sales'}>
                              Contact Sales for Lead Suite
                            </Button>
                          </div>
                        )}
                        {facility.plan === 'lead_suite' && (
                          <Button variant="outline" onClick={() => window.location.href = '/providers/contact-sales'}>
                            Contact Sales
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}

                  {facilities.length === 0 && (
                    <div className="text-center py-10 bg-white rounded-xl border border-dashed border-slate-300">
                      <p className="text-slate-500">No facilities found. Claim or add a facility to manage billing.</p>
                    </div>
                  )}
                </div>
              )}
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
