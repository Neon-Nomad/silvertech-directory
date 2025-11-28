import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Check } from 'lucide-react';

interface CareType {
  id: string;
  name: string;
  description: string | null;
}

interface FacilityCareTypesEditorProps {
  facilityId: string;
}

export const FacilityCareTypesEditor: React.FC<FacilityCareTypesEditorProps> = ({ facilityId }) => {
  const [allCareTypes, setAllCareTypes] = useState<CareType[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [facilityId]);

  const fetchData = async () => {
    try {
      // 1. Fetch all care types
      const { data: careTypesData, error: careTypesError } = await supabase
        .from('care_types')
        .select('*')
        .order('name', { ascending: true });

      if (careTypesError) throw careTypesError;
      setAllCareTypes(careTypesData || []);

      // 2. Fetch selected care types for this facility
      const { data: selectedData, error: selectedError } = await supabase
        .from('facility_care_types')
        .select('care_type_id')
        .eq('facility_id', facilityId);

      if (selectedError) throw selectedError;
      
      const ids = new Set((selectedData || []).map(item => item.care_type_id));
      setSelectedIds(ids);

    } catch (err) {
      console.error('Error fetching care types:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCareType = async (careTypeId: string) => {
    if (saving) return;
    setSaving(true);
    
    const isSelected = selectedIds.has(careTypeId);
    const newSelectedIds = new Set(selectedIds);

    try {
      if (isSelected) {
        // Remove
        const { error } = await supabase
          .from('facility_care_types')
          .delete()
          .eq('facility_id', facilityId)
          .eq('care_type_id', careTypeId);
          
        if (error) throw error;
        newSelectedIds.delete(careTypeId);
      } else {
        // Add
        const { error } = await supabase
          .from('facility_care_types')
          .insert({
            facility_id: facilityId,
            care_type_id: careTypeId
          });
          
        if (error) throw error;
        newSelectedIds.add(careTypeId);
      }
      
      setSelectedIds(newSelectedIds);
    } catch (err) {
      console.error('Error toggling care type:', err);
      alert('Failed to update care type');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="py-4 text-center">Loading care types...</div>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <h2 className="text-lg font-bold text-slate-900 mb-6">Care Types Provided</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allCareTypes.map((careType) => {
          const isSelected = selectedIds.has(careType.id);
          return (
            <button
              key={careType.id}
              onClick={() => toggleCareType(careType.id)}
              disabled={saving}
              className={`flex items-start gap-4 p-4 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'bg-primary-50 border-primary-200 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                isSelected
                  ? 'bg-primary-600 border-primary-600 text-white'
                  : 'bg-white border-slate-300'
              }`}>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </div>
              <div>
                <span className={`block font-semibold mb-1 ${isSelected ? 'text-primary-900' : 'text-slate-900'}`}>
                  {careType.name}
                </span>
                {careType.description && (
                  <span className="text-sm text-slate-500 leading-relaxed">
                    {careType.description}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
