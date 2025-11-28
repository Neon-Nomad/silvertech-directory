import React from 'react';
import { AgingAgency } from '../../../src/utils/agingAgencyData';
import { MapPin, Phone, ExternalLink, Heart, ShieldCheck, Users } from 'lucide-react';

interface AgingAgencyCardProps {
  agency: AgingAgency;
  variant?: 'full' | 'compact';
}

export const AgingAgencyCard: React.FC<AgingAgencyCardProps> = ({ agency, variant = 'full' }) => {
  if (!agency) return null;

  const isFull = variant === 'full';

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden ${isFull ? 'h-full' : ''}`}>
      {/* Header */}
      <div className="bg-emerald-50 p-4 border-b border-emerald-100">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-700">
            <Users size={24} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-lg leading-tight">
              {agency.program_name}
            </h3>
            <p className="text-emerald-700 text-sm font-medium mt-1">
              State-Funded Senior Support
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-4">
        <p className="text-slate-600 text-sm leading-relaxed">
          {agency.description}
        </p>

        {/* Services List - Only show full list in 'full' variant, or top 3 in 'compact' */}
        <div>
          <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
            <Heart size={16} className="text-emerald-500" />
            Services Funded & Provided
          </h4>
          <ul className="space-y-2">
            {(isFull ? agency.services_provided : agency.services_provided.slice(0, 3)).map((service, idx) => (
              <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                <span className="text-emerald-400 mt-1">•</span>
                <span>{service}</span>
              </li>
            ))}
            {!isFull && agency.services_provided.length > 3 && (
              <li className="text-xs text-emerald-600 font-medium pl-3">
                + {agency.services_provided.length - 3} more services...
              </li>
            )}
          </ul>
        </div>

        {/* Why It Matters - Full variant only */}
        {isFull && (
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
            <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-500" />
              Why Contact Your Local AAA?
            </h4>
            <ul className="space-y-2">
              {agency.why_it_matters.map((item, idx) => (
                <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                  <span className="text-blue-400 mt-1">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Contact Actions */}
        <div className="pt-2 flex flex-col gap-2">
          <a 
            href={`tel:${agency.contact.phone}`}
            className="flex items-center justify-center gap-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2.5 rounded-lg transition-colors"
          >
            <Phone size={18} />
            Call Helpline: {agency.contact.phone}
          </a>
          
          <div className="grid grid-cols-2 gap-2">
            <a 
              href={agency.contact.find_local_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              <MapPin size={16} className="text-emerald-600" />
              Find Local Office
            </a>
            <a 
              href={agency.contact.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-white border border-slate-200 hover:border-emerald-300 text-slate-700 font-medium py-2 rounded-lg transition-colors text-sm"
            >
              <ExternalLink size={16} className="text-emerald-600" />
              Official Website
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
