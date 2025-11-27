import React, { useState } from 'react';
import { BarChart3, Users, Calendar, Settings, AlertCircle, CheckCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FinancialSavingsGraphic } from './FinancialSavingsGraphic';
import { SubscriptionTierSelector } from './SubscriptionTierSelector';
import { LeadManagementCRM } from './LeadManagementCRM';
import { AIConnectSettings } from './AIConnectSettings';

const OperatorDashboard: React.FC = () => {
  const [isVerified, setIsVerified] = useState(false); // Mock verification status
  
  // Data Moat State
  const [dataMoat, setDataMoat] = useState({
    vacancy: 2,
    turnoverRate: 15,
    minPrice: 4500,
    maxPrice: 7200
  });

  const handleVerification = () => {
    // Mock verification logic
    const code = prompt("Enter the verification code from your postcard:");
    if (code) {
      setIsVerified(true);
      alert("Verification Successful! Dashboard Unlocked.");
    } else {
      alert("Invalid Code. Please check your mail.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Dashboard Header */}
      <header className="bg-white border-b border-slate-200 sticky top-16 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Operator Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${isVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {isVerified ? 'Verified Partner' : 'Verification Pending'}
            </span>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!isVerified && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 mb-8 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-yellow-900 mb-2">Unlock Your Dashboard</h3>
              <p className="text-yellow-800 mb-4">
                To ensure platform integrity, we require postcard verification. Enter the code mailed to your facility address to unlock full features.
              </p>
              <Button onClick={handleVerification} className="bg-yellow-600 hover:bg-yellow-700 text-white">
                Enter Verification Code
              </Button>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Stats Grid */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Total Views</h3>
                  <Users className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900">1,234</p>
                <span className="text-xs text-green-600 font-medium">+12% from last month</span>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Inquiries</h3>
                  <BarChart3 className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900">45</p>
                <span className="text-xs text-green-600 font-medium">+5 new today</span>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-slate-500">Tours Scheduled</h3>
                  <Calendar className="w-4 h-4 text-slate-400" />
                </div>
                <p className="text-2xl font-bold text-slate-900">8</p>
                <span className="text-xs text-slate-500">Next: Tomorrow 2pm</span>
              </div>
            </div>

            {/* Financial Graphic */}
            <FinancialSavingsGraphic />

            {/* Subscription Tiers */}
            <div className="mt-12">
               <SubscriptionTierSelector />
            </div>

            {/* Lead CRM - Only visible if verified */}
            {isVerified && (
              <div className="mt-12 space-y-12">
                <LeadManagementCRM />
                <AIConnectSettings />
              </div>
            )}

            {/* Lead CRM Placeholder (if not verified) */}
            {!isVerified && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 relative overflow-hidden mt-8">
               <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
                    <div className="text-center">
                      <Lock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-600 font-medium">Verify account to view leads</p>
                    </div>
                  </div>
               <h3 className="text-lg font-bold text-slate-900 mb-4">Recent Inquiries</h3>
               <div className="space-y-4">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                     <div>
                       <p className="font-medium text-slate-900">Potential Resident #{i}</p>
                       <p className="text-sm text-slate-500">Inquired about Memory Care</p>
                     </div>
                     <Button size="sm" variant="outline">View Details</Button>
                   </div>
                 ))}
               </div>
            </div>
            )}
          </div>

          {/* Sidebar / Data Moat */}
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-primary-600" />
                Live Data Status
              </h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Real-Time Vacancy</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={dataMoat.vacancy}
                      onChange={(e) => setDataMoat({...dataMoat, vacancy: parseInt(e.target.value)})}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      disabled={!isVerified}
                    />
                    <span className="text-sm text-slate-500">beds available</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Pricing Range (Monthly)</label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-slate-500">Min</span>
                      <input 
                        type="number" 
                        value={dataMoat.minPrice}
                        onChange={(e) => setDataMoat({...dataMoat, minPrice: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        disabled={!isVerified}
                      />
                    </div>
                    <div>
                      <span className="text-xs text-slate-500">Max</span>
                      <input 
                        type="number" 
                        value={dataMoat.maxPrice}
                        onChange={(e) => setDataMoat({...dataMoat, maxPrice: parseInt(e.target.value)})}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                        disabled={!isVerified}
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Staff Turnover Rate (Annual)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      value={dataMoat.turnoverRate}
                      onChange={(e) => setDataMoat({...dataMoat, turnoverRate: parseInt(e.target.value)})}
                      className="w-20 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                      disabled={!isVerified}
                    />
                    <span className="text-sm text-slate-500">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Lower is better. Industry avg: 45%</p>
                </div>

                <Button className="w-full" disabled={!isVerified}>
                  Update Listing
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OperatorDashboard;
