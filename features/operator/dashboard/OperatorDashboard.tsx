import React from 'react';
import { BarChart3, Users, DollarSign, TrendingUp, Calendar, Bell, Settings } from 'lucide-react';

const OperatorDashboard: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Operator Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back, Sunrise Senior Living</p>
            </div>
            <div className="flex items center gap-4">
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative">
                <Bell size={24} />
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent-500 rounded-full"></span>
              </button>
              <button className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors">
                <Settings size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Users className="text-primary-600" size={24} />
              </div>
              <span className="text-sm font-medium text-green-600">+12%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">87.3%</h3>
            <p className="text-slate-600 text-sm">Occupancy Rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <TrendingUp className="text-secondary-600" size={24} />
              </div>
              <span className="text-sm font-medium text-green-600">+8%</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">143</h3>
            <p className="text-slate-600 text-sm">Active Leads</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-accent-100 rounded-lg">
                <DollarSign className="text-accent-600" size={24} />
              </div>
              <span className="text-sm font-medium text-slate-600">-</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">$5,200</h3>
            <p className="text-slate-600 text-sm">Avg. Monthly Rate</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Calendar className="text-purple-600" size={24} />
              </div>
              <span className="text-sm font-medium text-green-600">+5</span>
            </div>
            <h3 className="text-2xl font-bold text-slate-900">12</h3>
            <p className="text-slate-600 text-sm">Scheduled Tours</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Recent Leads */}
            <div className="bg-white rounded-lg shadow">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Recent Leads</h2>
              </div>
              <div className="divide-y divide-slate-200">
                {[
                  { name: 'Sarah Johnson', type: 'Memory Care', date: '2 hours ago', status: 'New' },
                  { name: 'Michael Chen', type: 'Assisted Living', date: '5 hours ago', status: 'Contacted' },
                  { name: 'Emily Rodriguez', type: 'Independent Living', date: '1 day ago', status: 'Tour Scheduled' },
                ].map((lead, i) => (
                  <div key={i} className="p-6 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900">{lead.name}</h3>
                        <p className="text-sm text-slate-600">{lead.type}</p>
                      </div>
                      <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-xs font-medium">
                        {lead.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500">{lead.date}</p>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-slate-200 text-center">
                <button className="text-primary-600 hover:text-primary-700 font-medium text-sm">
                  View All Leads →
                </button>
              </div>
            </div>

            {/* Performance Chart Placeholder */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Occupancy Trend</h2>
              <div className="h-64 bg-slate-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 size={48} className="text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600">Chart visualization would go here</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button className="w-full bg-primary-600 hover:bg-primary-700 text-white py-3 rounded-md font-medium transition-colors">
                  Update Availability
                </button>
                <button className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-md font-medium transition-colors">
                  Add New Lead
                </button>
                <button className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 py-3 rounded-md font-medium transition-colors">
                  Schedule Tour
                </button>
              </div>
            </div>

            {/* Upcoming Tours */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Upcoming Tours</h2>
              <div className="space-y-4">
                {[
                  { time: '10:00 AM', name: 'Smith Family', type: 'Memory Care' },
                  { time: '2:30 PM', name: 'Jones Family', type: 'Assisted Living' },
                  { time: '4:00 PM', name: 'Williams Family', type: 'Independent Living' },
                ].map((tour, i) => (
                  <div key={i} className="flex justify-between items-start p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{tour.time}</p>
                      <p className="text-sm text-slate-600">{tour.name}</p>
                      <p className="text-xs text-slate-500">{tour.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperatorDashboard;
