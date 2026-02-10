import React, { useState, useEffect } from 'react';
import { Edit, MapPin, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { useAuth } from '@/src/context/AuthProvider';
import { useNavigate } from 'react-router-dom';

export const MyFacilities: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return <div className="text-center py-10">Loading facilities...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-900">My Facilities</h2>
        <Button variant="outline" onClick={() => navigate('/claim-business')}>
          Claim Another Facility
        </Button>
      </div>

      {facilities.length === 0 ? (
        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center">
          <h3 className="text-lg font-medium text-slate-900 mb-2">No facilities found</h3>
          <p className="text-slate-500 mb-6">You haven't claimed any facilities yet.</p>
          <Button variant="primary" onClick={() => navigate('/claim-business')}>
            Claim Your First Facility
          </Button>
        </div>
      ) : (
        <div className="grid gap-6">
          {facilities.map((facility) => (
            <div key={facility.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between gap-6">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-slate-100 rounded-lg overflow-hidden flex-shrink-0">
                  {facility.image ? (
                    <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">No Img</div>
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 mb-1">{facility.name}</h3>
                  <p className="text-slate-500 flex items-center gap-1 text-sm mb-3">
                    <MapPin className="w-4 h-4" />
                    {facility.address_line1}, {facility.city}, {facility.state}
                  </p>
                  <div className="flex gap-2">
                    <span className="bg-green-100 text-green-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                    <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Verified Owner
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 justify-center min-w-[150px]">
                <Button variant="outline" className="w-full justify-center" onClick={() => window.open(`/facility/${facility.id}`, '_blank')}>
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View Public Page
                </Button>
                <Button variant="primary" className="w-full justify-center">
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
