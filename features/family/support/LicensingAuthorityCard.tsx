import React from 'react';
import { Building2, Phone, ExternalLink, FileText, AlertTriangle } from 'lucide-react';
import { LicensingAuthority } from '@/src/utils/licensingData';

interface LicensingAuthorityCardProps {
  authority: LicensingAuthority;
  variant?: 'compact' | 'full';
}

export const LicensingAuthorityCard: React.FC<LicensingAuthorityCardProps> = ({ authority, variant = 'compact' }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-start gap-3">
        <Building2 className="w-6 h-6 text-slate-700 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-slate-900">State Licensing Authority</h3>
          <p className="text-sm text-slate-600">Official Regulatory Agency</p>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600 font-medium">
          {authority.agency_name}
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-slate-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">Agency Phone</p>
              <a href={`tel:${authority.phone}`} className="text-slate-900 font-semibold hover:text-primary-600">
                {authority.phone}
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <FileText className="w-4 h-4 text-slate-400 mt-1" />
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">License Verification</p>
              <a 
                href={authority.website_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-600 font-medium hover:underline flex items-center gap-1"
              >
                Verify License Status <ExternalLink size={12} />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-500 mt-1" />
            <div>
              <p className="text-sm font-medium text-slate-600 uppercase">Complaints</p>
              <a 
                href={authority.complaint_intake_url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-amber-700 font-medium hover:underline flex items-center gap-1"
              >
                File an Official Complaint <ExternalLink size={12} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
