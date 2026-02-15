import React, { useEffect, useMemo, useState } from 'react';
import { Edit, ExternalLink, MapPin, Plus, Search, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';
import { useNavigate } from 'react-router-dom';

type FilterStatus = 'all' | 'verified' | 'pending';
type SortMode = 'updated_desc' | 'name_asc';

const getStatus = (facility: any): FilterStatus => {
  if (facility.owner_id && facility.owner_id === facility.assigned_plan_owner_id) return 'verified';
  if (facility.owner_id) return 'pending';
  return 'all';
};

const getProfileStrength = (facility: any): number => {
  let score = 0;
  if (facility.name) score += 25;
  if (facility.description && facility.description.length > 50) score += 20;
  if (facility.phone) score += 15;
  if (facility.website) score += 10;
  if (facility.email) score += 10;
  if (facility.min_price || facility.max_price) score += 10;
  if (facility.address_line1) score += 10;
  return Math.min(100, score);
};

export const MyFacilities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [sortMode, setSortMode] = useState<SortMode>('updated_desc');

  useEffect(() => {
    const fetchFacilities = async () => {
      if (!user) return;
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .eq('owner_id', user.id);

        if (error) throw error;
        setFacilities(data || []);
      } catch (err) {
        console.error('Error fetching facilities:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [user]);

  const filteredFacilities = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const filtered = facilities.filter((facility) => {
      const status = getStatus(facility);
      if (statusFilter !== 'all' && status !== statusFilter) return false;

      if (!normalizedQuery) return true;
      const haystack = `${facility.name || ''} ${facility.city || ''} ${facility.state || ''}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    });

    if (sortMode === 'name_asc') {
      filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    } else {
      filtered.sort((a, b) => {
        const aDate = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const bDate = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        return bDate - aDate;
      });
    }

    return filtered;
  }, [facilities, query, statusFilter, sortMode]);

  if (loading) {
    return <div className="py-10 text-center text-slate-600">Loading facilities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">My Facilities</h2>
          <p className="mt-1 text-slate-600">Manage and update your senior care community listings.</p>
        </div>
        <Button variant="primary" className="min-h-11" onClick={() => navigate('/claim-business')}>
          <Plus className="mr-2 h-4 w-4" />
          Claim New Facility
        </Button>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search facilities by name or location..."
              className="w-full rounded-lg border border-slate-300 py-2.5 pl-10 pr-3 text-sm focus:border-slate-400 focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700">
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as FilterStatus)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
              </select>
            </label>
            <label className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 px-3 text-sm text-slate-700">
              <ArrowUpDown className="h-4 w-4" />
              <span className="hidden sm:inline">Sort</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as SortMode)}
                className="bg-transparent text-sm focus:outline-none"
              >
                <option value="updated_desc">Newest</option>
                <option value="name_asc">A-Z</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {filteredFacilities.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <h3 className="mb-2 text-lg font-semibold text-slate-900">No facilities match your filters</h3>
          <p className="mb-6 text-slate-500">Try updating search or status filters, or claim a new facility.</p>
          <Button variant="outline" className="min-h-11" onClick={() => navigate('/claim-business')}>
            Claim Facility
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {filteredFacilities.map((facility) => {
            const status = getStatus(facility);
            const profileStrength = getProfileStrength(facility);

            return (
              <div key={facility.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="relative h-48 bg-slate-100">
                  {facility.image ? (
                    <img src={facility.image} alt={facility.name} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">No image yet</div>
                  )}
                  <div className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800">
                    {status === 'verified' ? 'Verified' : status === 'pending' ? 'Pending Review' : 'Claimed'}
                  </div>
                </div>
                <div className="space-y-4 p-5">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{facility.name}</h3>
                    <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      {facility.city}, {facility.state}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-y border-slate-100 py-3 text-sm">
                    <span className="text-slate-500">
                      Last updated:{' '}
                      {facility.updated_at ? new Date(facility.updated_at).toLocaleDateString() : 'Not set'}
                    </span>
                    <span className="font-semibold text-amber-700">{profileStrength}% Profile Strength</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      className="min-h-11 justify-center"
                      onClick={() => window.open(`/facility/${facility.id}`, '_blank')}
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      View Public Page
                    </Button>
                    <Button
                      variant="primary"
                      className="min-h-11 justify-center"
                      onClick={() => navigate(`/dashboard/facility/${facility.id}/edit`)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Details
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex flex-col items-center gap-6 border-t border-slate-200 pt-8">
        <p className="text-sm text-slate-500">
          Showing {filteredFacilities.length} of {facilities.length} facilities
        </p>
      </div>

      <div className="rounded-2xl bg-slate-900 p-6 text-white sm:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-4">
            <div className="mt-1 inline-flex h-10 w-10 items-center justify-center rounded-full bg-amber-300/20 text-amber-300">
              ?
            </div>
            <div>
              <h3 className="text-xl font-semibold">Need help with your listings?</h3>
              <p className="mt-1 text-sm text-slate-300">
                Our support team is available 24/7 to help you optimize your facility profiles.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              className="min-h-11 border-white/30 bg-white/10 text-white hover:bg-white/20"
              onClick={() => navigate('/dashboard/help')}
            >
              Documentation
            </Button>
            <Button variant="primary" className="min-h-11" onClick={() => navigate('/dashboard/help')}>
              Contact Support
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
