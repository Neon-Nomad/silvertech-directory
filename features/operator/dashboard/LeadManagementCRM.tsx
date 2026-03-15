import React, { useState } from 'react';
import { Search, Filter, Phone, Mail, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Lead {
  id: number;
  name: string;
  interest: string;
  status: 'New' | 'Contacted' | 'Touring' | 'Won' | 'Lost';
  date: string;
  budget: string;
}

const mockLeads: Lead[] = [
  { id: 1, name: "Sarah Johnson", interest: "Memory Care", status: "New", date: "2 hours ago", budget: "$6k - $8k" },
  { id: 2, name: "Michael Chen", interest: "Assisted Living", status: "Contacted", date: "5 hours ago", budget: "$5k - $7k" },
  { id: 3, name: "Emily Rodriguez", interest: "Independent Living", status: "Touring", date: "1 day ago", budget: "$4k - $6k" },
  { id: 4, name: "David Kim", interest: "Memory Care", status: "Won", date: "3 days ago", budget: "$7k+" },
  { id: 5, name: "Robert Smith", interest: "Assisted Living", status: "Lost", date: "1 week ago", budget: "$5k - $6k" },
];

export const LeadManagementCRM: React.FC = () => {
  const [leads] = useState<Lead[]>(mockLeads);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'New': return 'bg-primary-100 text-primary-800';
      case 'Contacted': return 'bg-yellow-100 text-yellow-800';
      case 'Touring': return 'bg-primary-100 text-primary-800';
      case 'Won': return 'bg-green-100 text-green-800';
      case 'Lost': return 'bg-slate-100 text-slate-600';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
        <h3 className="text-lg font-bold text-slate-900">Lead Management</h3>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search leads..." 
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 w-full"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" /> Filter
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 text-slate-500 font-medium">
            <tr>
              <th className="px-6 py-4">Name</th>
              <th className="px-6 py-4">Interest</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Budget</th>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {leads.map((lead) => (
              <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                <td className="px-6 py-4 text-slate-600">{lead.interest}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600">{lead.budget}</td>
                <td className="px-6 py-4 text-slate-500">{lead.date}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button className="p-1 text-slate-400 hover:text-primary-600 transition-colors" title="Call">
                      <Phone className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-primary-600 transition-colors" title="Email">
                      <Mail className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-slate-400 hover:text-primary-600 transition-colors" title="Schedule Tour">
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 border-t border-slate-200 bg-slate-50 text-center">
        <Button variant="ghost" size="sm" className="text-primary-600 hover:text-primary-700">
          View All Leads
        </Button>
      </div>
    </div>
  );
};
