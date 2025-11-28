import React from 'react';
import { MedicaidWaiver } from '../../../src/utils/medicaidData';
import { DollarSign, CheckCircle, AlertCircle, FileText, Phone, ExternalLink, Activity } from 'lucide-react';

interface MedicaidWaiverCardProps {
  waiver: MedicaidWaiver;
}

export const MedicaidWaiverCard: React.FC<MedicaidWaiverCardProps> = ({ waiver }) => {
  if (!waiver) return null;

  const isWaitlist = waiver.status === 'Waitlist';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      {/* Header */}
      <div className="bg-blue-50 p-4 border-b border-blue-100">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-lg leading-tight">
                {waiver.program_name}
              </h3>
              <p className="text-blue-700 text-sm font-medium mt-1">
                {waiver.type}
              </p>
            </div>
          </div>
          {isWaitlist && (
            <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide">
              <AlertCircle size={12} /> Waitlist Active
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-6 flex-grow">
        <p className="text-slate-600 text-sm leading-relaxed">
          {waiver.description}
        </p>

        {/* Financial Eligibility */}
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
          <h4 className="font-semibold text-slate-900 text-sm mb-3 flex items-center gap-2">
            <DollarSign size={16} className="text-emerald-600" />
            Financial Eligibility (2024 Est.)
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Monthly Income Limit</p>
              <p className="text-slate-900 font-bold">{waiver.financial_eligibility.income_limit}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Asset Limit</p>
              <p className="text-slate-900 font-bold">{waiver.financial_eligibility.asset_limit}</p>
            </div>
          </div>
          {waiver.financial_eligibility.notes && (
            <p className="text-xs text-slate-500 mt-2 italic border-t border-slate-200 pt-2">
              Note: {waiver.financial_eligibility.notes}
            </p>
          )}
        </div>

        {/* Services Covered */}
        <div>
          <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
            <Activity size={16} className="text-blue-500" />
            Services Covered
          </h4>
          <div className="flex flex-wrap gap-2">
            {waiver.care_services.map((service, idx) => (
              <span key={idx} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                {service}
              </span>
            ))}
          </div>
        </div>

        {/* Functional Eligibility */}
        <div>
            <h4 className="font-semibold text-slate-900 text-sm mb-2 flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-500" />
                Who Qualifies?
            </h4>
            <ul className="space-y-1">
                {waiver.functional_eligibility.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                        <span className="text-emerald-400 mt-1">•</span>
                        <span>{item}</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
        <a 
            href={waiver.contact.website}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-2 bg-white border border-slate-200 hover:border-blue-300 text-slate-700 font-medium py-2 rounded-lg transition-colors text-sm"
        >
            <ExternalLink size={16} className="text-blue-600" />
            Official Details
        </a>
        <a 
            href={`tel:${waiver.contact.phone}`}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition-colors text-sm"
        >
            <Phone size={16} />
            {waiver.contact.phone}
        </a>
      </div>
    </div>
  );
};
