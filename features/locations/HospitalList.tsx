import React from 'react';
import { Building2, Phone, MapPin, AlertCircle } from 'lucide-react';
import { Hospital } from '@/src/utils/hospitalData';

interface HospitalListProps {
  hospitals: Hospital[];
  cityName: string;
}

export const HospitalList: React.FC<HospitalListProps> = ({ hospitals, cityName }) => {
  if (!hospitals || hospitals.length === 0) return null;

  const erCount = hospitals.filter(h => h.emergency_services === 'Yes').length;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900">Nearby Hospitals</h3>
        <span className="bg-primary-100 text-primary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
          {hospitals.length} Total
        </span>
      </div>

      <div className="mb-4 text-sm text-slate-600">
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={16} className="text-red-500" />
          <span className="font-medium text-slate-900">{erCount} with Emergency Services</span>
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
        {hospitals.map((hospital, idx) => (
          <div key={idx} className="border-b border-slate-100 last:border-0 pb-3 last:pb-0">
            <h4 className="font-semibold text-slate-800 text-sm mb-1">{hospital.name}</h4>
            
            <div className="flex items-start gap-2 text-xs text-slate-500 mb-1">
              <MapPin size={12} className="mt-0.5 flex-shrink-0" />
              <span>{hospital.address}, {hospital.city}</span>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Building2 size={12} className="flex-shrink-0" />
              <span>{hospital.type}</span>
            </div>

            {hospital.phone && (
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <Phone size={12} className="flex-shrink-0" />
                <a href={`tel:${hospital.phone}`} className="hover:text-primary-600 transition-colors">
                  {hospital.phone}
                </a>
              </div>
            )}
            
            {hospital.emergency_services === 'Yes' && (
               <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700">
                 Emergency Services Available
               </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
