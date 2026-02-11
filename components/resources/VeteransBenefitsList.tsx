import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink, ShieldCheck } from 'lucide-react';
import benefitsData from '@/src/data/veterans_benefits.json';

export const VeteransBenefitsList: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleAccordion = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary-100 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-primary-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Veterans Benefits Authority</h2>
        </div>
        <p className="text-slate-600 text-sm">
          Veterans and their spouses may be eligible for financial assistance to help cover the cost of care.
          Explore these official VA programs.
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {benefitsData.veterans_benefits_authority.map((benefit, index) => (
          <div key={index} className="transition-colors hover:bg-slate-50">
            <button
              onClick={() => toggleAccordion(index)}
              className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
            >
              <span className="font-semibold text-slate-800">{benefit.program_name}</span>
              {openIndex === index ? (
                <ChevronUp className="w-5 h-5 text-slate-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-400" />
              )}
            </button>

            {openIndex === index && (
              <div className="px-6 pb-6 animate-fade-in">
                <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                  {benefit.description}
                </p>

                {/* @ts-ignore */}
                {benefit.services_provided && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Services Provided</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {/* @ts-ignore */}
                            {benefit.services_provided.map((service, i) => (
                                <li key={i} className="text-sm text-slate-600 pl-2 -indent-2 ml-2">
                                    {service}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                <div className="mb-4">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Eligibility Criteria</h4>
                  <ul className="list-disc list-inside space-y-1">
                    {benefit.eligibility_criteria.map((criteria, i) => (
                      <li key={i} className="text-sm text-slate-600 pl-2 -indent-2 ml-2">
                        {criteria}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* @ts-ignore */}
                {benefit.why_it_matters && (
                    <div className="mb-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Why It Matters</h4>
                        <ul className="list-disc list-inside space-y-1">
                            {/* @ts-ignore */}
                            {benefit.why_it_matters.map((item, i) => (
                                <li key={i} className="text-sm text-slate-600 pl-2 -indent-2 ml-2">
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* @ts-ignore */}
                {benefit.why_explore && (
                    <div className="mb-4 bg-primary-50 p-4 rounded-lg border border-primary-100">
                        <h4 className="text-xs font-bold text-primary-800 uppercase tracking-wide mb-2">Why Explore This?</h4>
                        <p className="text-sm text-primary-900 leading-relaxed">
                            {/* @ts-ignore */}
                            {benefit.why_explore}
                        </p>
                    </div>
                )}

                {benefit.notes && (
                    <div className="mb-4 bg-amber-50 p-3 rounded-lg border border-amber-100 text-sm text-amber-800">
                        <strong>Note:</strong> {benefit.notes}
                    </div>
                )}

                <a
                  href={benefit.official_va_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary-600 hover:text-primary-700 hover:underline"
                >
                  Visit Official VA Page <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
