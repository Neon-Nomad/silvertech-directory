import React, { useState, useEffect } from 'react';
import { Mail, Phone, Calendar, Search } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';

export const LeadsView: React.FC = () => {
  const { user } = useAuth();
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeads = async () => {
      if (!user) return;
      try {
        // First get user's facilities
        const { data: facilities } = await supabase
            .from('facilities')
            .select('id')
            .eq('owner_id', user.id);
            
        if (!facilities || facilities.length === 0) {
            setLeads([]);
            setLoading(false);
            return;
        }
        
        const facilityIds = facilities.map(f => f.id);

        const { data, error } = await supabase
          .from('leads')
          .select('*, facilities(name)')
          .in('facility_id', facilityIds)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setLeads(data || []);
      } catch (err) {
        console.error('Error fetching leads:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeads();
  }, [user]);

  if (loading) {
    return <div className="text-center py-10">Loading leads...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">Inquiries & Leads</h2>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
                type="text" 
                placeholder="Search leads..." 
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
        </div>
      </div>

      {leads.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No leads yet</h3>
          <p className="text-slate-500">When potential residents contact your facility, they will appear here.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 font-semibold text-slate-900">Name</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Contact Info</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Facility</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Message</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Date</th>
                  <th className="px-6 py-4 font-semibold text-slate-900">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{lead.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <a href={`mailto:${lead.email}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                          <Mail className="w-3 h-3" /> {lead.email}
                        </a>
                        {lead.phone && (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-2 text-slate-600 hover:text-primary-600">
                            <Phone className="w-3 h-3" /> {lead.phone}
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{lead.facilities?.name}</td>
                    <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={lead.message}>
                      {lead.message || '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3" />
                        {new Date(lead.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary-600 hover:text-primary-700 font-medium">
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
