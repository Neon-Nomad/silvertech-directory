import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Check, Loader2 } from 'lucide-react';

interface Amenity {
  id: string;
  name: string;
  category: string;
  icon: string | null;
}

interface FacilityAmenitiesEditorProps {
  facilityId: string;
}

export const FacilityAmenitiesEditor: React.FC<FacilityAmenitiesEditorProps> = ({ facilityId }) => {
  const [allAmenities, setAllAmenities] = useState<Amenity[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [facilityId]);

  const fetchData = async () => {
    try {
      // 1. Fetch all amenities
      const { data: amenitiesData, error: amenitiesError } = await supabase
        .from('amenities')
        .select('*')
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (amenitiesError) throw amenitiesError;
      setAllAmenities(amenitiesData || []);

      // 2. Fetch selected amenities for this facility
      const { data: selectedData, error: selectedError } = await supabase
        .from('facility_amenities')
        .select('amenity_id')
        .eq('facility_id', facilityId);

      if (selectedError) throw selectedError;
      
      const ids = new Set((selectedData || []).map(item => item.amenity_id));
      setSelectedIds(ids);

    } catch (err) {
      console.error('Error fetching amenities:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAmenity = async (amenityId: string) => {
    if (saving) return;
    setSaving(true);
    
    const isSelected = selectedIds.has(amenityId);
    const newSelectedIds = new Set(selectedIds);

    try {
      if (isSelected) {
        // Remove
        const { error } = await supabase
          .from('facility_amenities')
          .delete()
          .eq('facility_id', facilityId)
          .eq('amenity_id', amenityId);
          
        if (error) throw error;
        newSelectedIds.delete(amenityId);
      } else {
        // Add
        const { error } = await supabase
          .from('facility_amenities')
          .insert({
            facility_id: facilityId,
            amenity_id: amenityId
          });
          
        if (error) throw error;
        newSelectedIds.add(amenityId);
      }
      
      setSelectedIds(newSelectedIds);
    } catch (err) {
      console.error('Error toggling amenity:', err);
      alert('Failed to update amenity');
    } finally {
      setSaving(false);
    }
  };

  // Group amenities by category
  const groupedAmenities = allAmenities.reduce((acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  }, {} as Record<string, Amenity[]>);

  if (loading) return <div className="py-4 text-center">Loading amenities...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Amenities & Features</h2>
      
      <div className="space-y-8">
        {Object.entries(groupedAmenities).map(([category, amenities]) => (
          <div key={category}>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">
              {category}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(amenities as Amenity[]).map((amenity) => {
                const isSelected = selectedIds.has(amenity.id);
                return (
                  <button
                    key={amenity.id}
                    onClick={() => toggleAmenity(amenity.id)}
                    disabled={saving}
                    className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                      isSelected
                        ? 'bg-primary-50 border-primary-200 text-primary-900'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary-600 border-primary-600 text-white'
                        : 'bg-white border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className="text-sm font-medium">{amenity.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
