import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';

export interface ProfileCompletenessData {
  name?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address_line1?: string;
  min_price?: number | null;
  max_price?: number | null;
}

export interface ProfileCompletenessCounts {
  photos: number;
  amenities: number;
  careTypes: number;
}

interface ProfileCompletenessProps {
  data: ProfileCompletenessData;
  counts: ProfileCompletenessCounts;
}

export const getProfileCompleteness = (data: ProfileCompletenessData, counts: ProfileCompletenessCounts) => {
  const criteria = [
    { label: 'Facility Name', met: !!data.name },
    { label: 'Description', met: !!data.description && data.description.length > 50 },
    { label: 'Address', met: !!data.address_line1 },
    { label: 'Phone Number', met: !!data.phone },
    { label: 'Email Address', met: !!data.email },
    { label: 'Website', met: !!data.website },
    { label: 'Pricing (Min & Max)', met: !!data.min_price && !!data.max_price },
    { label: 'Photos (At least 1)', met: counts.photos > 0 },
    { label: 'Amenities (At least 3)', met: counts.amenities >= 3 },
    { label: 'Care Types (At least 1)', met: counts.careTypes > 0 },
  ];

  const metCount = criteria.filter(c => c.met).length;
  const totalCount = criteria.length;
  const percentage = Math.round((metCount / totalCount) * 100);

  return { criteria, metCount, totalCount, percentage };
};

export const ProfileCompleteness: React.FC<ProfileCompletenessProps> = ({ data, counts }) => {
  const { criteria, percentage } = getProfileCompleteness(data, counts);

  const getStatusColor = () => {
    if (percentage < 50) return 'text-red-600 bg-red-50 border-red-200';
    if (percentage < 80) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-green-600 bg-green-50 border-green-200';
  };

  const getProgressBarColor = () => {
    if (percentage < 50) return 'bg-red-500';
    if (percentage < 80) return 'bg-amber-500';
    return 'bg-green-500';
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-900">Profile Strength</h2>
        <span className={`text-sm font-bold px-3 py-1 rounded-full border ${getStatusColor()}`}>
          {percentage}%
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 mb-6">
        <div 
          className={`h-2.5 rounded-full transition-all duration-500 ${getProgressBarColor()}`} 
          style={{ width: `${percentage}%` }}
        ></div>
      </div>

      {/* Checklist */}
      <div className="space-y-3">
        {criteria.map((item, index) => (
          <div key={index} className="flex items-center gap-3 text-sm">
            {item.met ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
            )}
            <span className={item.met ? 'text-slate-700' : 'text-slate-400'}>
              {item.label}
            </span>
          </div>
        ))}
      </div>

      {percentage < 100 && (
        <div className="mt-6 p-3 bg-primary-50 text-primary-700 text-sm rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            Complete your profile to improve your ranking and attract more families.
          </p>
        </div>
      )}
    </div>
  );
};
