import React from 'react';
import { Shield, Phone, Mail, Globe, MapPin, ExternalLink } from 'lucide-react';
import { OmbudsmanProgram } from '@/src/utils/ombudsmanData';

interface OmbudsmanCardProps {
  program: OmbudsmanProgram;
  variant?: 'compact' | 'full';
}

export const OmbudsmanCard: React.FC<OmbudsmanCardProps> = ({ program, variant = 'compact' }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="bg-primary-50 p-4 border-b border-primary-100 flex items-start gap-3">
        <Shield className="w-6 h-6 text-primary-700 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-primary-900">Consumer Protection</h3>
          <p className="text-xs text-primary-700">Official State Ombudsman</p>
        </div>
      </div>
      
      <div className="p-5 space-y-4">
        <p className="text-sm text-slate-600">
          If you have concerns about the care or safety of a resident, contact the {program.state} Long-Term Care Ombudsman. They provide free, confidential advocacy.
        </p>

        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Phone className="w-4 h-4 text-slate-400 mt-1" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Phone</p>
              <a href={`tel:${program.phone}`} className="text-slate-900 font-semibold hover:text-primary-600">
                {program.phone}
              </a>
            </div>
          </div>

          {program.email && (
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-slate-400 mt-1" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Email</p>
                <a href={`mailto:${program.email}`} className="text-slate-900 font-medium hover:text-primary-600 break-all">
                  {program.email}
                </a>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Globe className="w-4 h-4 text-slate-400 mt-1" />
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase">Website</p>
              <a 
                href={program.website} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary-600 font-medium hover:underline flex items-center gap-1"
              >
                Visit Ombudsman Site <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {variant === 'full' && (
            <div className="flex items-start gap-3 pt-2 border-t border-slate-100">
              <MapPin className="w-4 h-4 text-slate-400 mt-1" />
              <div>
                <p className="text-xs font-medium text-slate-500 uppercase">Office Address</p>
                <p className="text-sm text-slate-700">{program.address}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
