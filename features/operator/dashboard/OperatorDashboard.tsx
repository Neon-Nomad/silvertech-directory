import React, { useState } from 'react';
import { LayoutDashboard, Building2, Users, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/src/context/AuthProvider';
import { MyFacilities } from './MyFacilities';
import { LeadsView } from './LeadsView';

const OperatorDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'facilities' | 'leads' | 'settings'>('overview');

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
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            Overview
          </button>
          
          <button
            onClick={() => setActiveTab('facilities')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'facilities' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-5 h-5" />
            My Facilities
          </button>
          
          <button
            onClick={() => setActiveTab('leads')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'leads' 
                ? 'bg-primary-50 text-primary-700' 
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Users className="w-5 h-5" />
            Leads
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings' 
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
