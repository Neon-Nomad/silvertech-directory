import React from 'react';
import { Activity, AlertCircle, MapPin } from 'lucide-react';
import { HealthcareScore, Hospital } from '@/src/utils/hospitalData';

interface HealthcareScoreCardProps {
  score: HealthcareScore;
  nearestHospital: Hospital | null;
  nearestDistance: number | null;
}

export const HealthcareScoreCard: React.FC<HealthcareScoreCardProps> = ({ score, nearestHospital, nearestDistance }) => {
  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200';
      case 'B': return 'text-primary-600 bg-primary-50 border-primary-200';
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-200';
      default: return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600" />
          Healthcare Access
        </h3>
        <div className={`w-12 h-12 flex items-center justify-center rounded-lg border-2 text-2xl font-bold ${getGradeColor(score.grade)}`}>
          {score.grade}
        </div>
      </div>

      <div className="space-y-4">
        {/* Nearest Hospital */}
        {nearestHospital ? (
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Nearest Hospital</p>
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100">
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-slate-900 text-sm line-clamp-1">{nearestHospital.name}</span>
                <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
                  {nearestDistance?.toFixed(1)} mi
                </span>
              </div>
              
              <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                <MapPin size={10} />
                <span className="truncate">{nearestHospital.address}, {nearestHospital.city}</span>
              </div>

              {nearestHospital.emergency_services === 'Yes' ? (
                <div className="inline-flex items-center gap-1 text-xs text-green-700 font-medium bg-green-50 px-2 py-0.5 rounded">
                  <AlertCircle size={10} /> Emergency Services
                </div>
              ) : (
                <div className="inline-flex items-center gap-1 text-xs text-amber-700 font-medium bg-amber-50 px-2 py-0.5 rounded">
                  No Emergency Services
                </div>
              )}
            </div>
          </div>
        ) : (
             <div className="text-sm text-slate-500 italic">No hospital data available nearby.</div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
            <div className="text-lg font-bold text-slate-900">{score.details.erHospitalCount}</div>
            <div className="text-[10px] text-slate-500 uppercase font-medium">ERs Nearby</div>
          </div>
          <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
            <div className="text-lg font-bold text-slate-900">{score.details.totalHospitalCount}</div>
            <div className="text-[10px] text-slate-500 uppercase font-medium">Total Hospitals</div>
          </div>
        </div>
      </div>
    </div>
  );
};
