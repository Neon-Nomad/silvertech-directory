import React from 'react';
import { Section } from './ui/Section';
import { AlertTriangle, DollarSign, Search, XCircle, FileWarning, EyeOff } from 'lucide-react';

export const Problem: React.FC = () => {
  const problems = [
    {
      icon: DollarSign,
      title: "Predatory Economics",
      description: "Referral agencies charge 100% of the first month's rent ($5k–$10k) per move-in. This incentivizes pushing families to the highest bidder, not the best care.",
      color: "accent",
      gradient: "from-orange-50 to-orange-100",
      iconColor: "text-orange-600",
      borderColor: "group-hover:border-orange-200"
    },
    {
      icon: FileWarning,
      title: "Broken Workflow",
      description: "Supply-side operators lack digital tools. They rely on spreadsheets and fax machines, leading to lost leads and inaccurate vacancy data.",
      color: "primary",
      gradient: "from-indigo-50 to-indigo-100",
      iconColor: "text-indigo-600",
      borderColor: "group-hover:border-indigo-200"
    },
    {
      icon: EyeOff,
      title: "Zero Transparency",
      description: "Families face opaque pricing and confusing options. They are overwhelmed by aggressive sales calls from lead aggregators selling their data.",
      color: "secondary",
      gradient: "from-teal-50 to-teal-100",
      iconColor: "text-teal-600",
      borderColor: "group-hover:border-teal-200"
    }
  ];

  return (
    <Section id="problem" className="bg-white relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
        <div className="absolute right-0 top-0 w-1/2 h-1/2 bg-gradient-to-bl from-primary-500 to-transparent rounded-full blur-3xl transform translate-x-1/3 -translate-y-1/3"></div>
        <div className="absolute left-0 bottom-0 w-1/2 h-1/2 bg-gradient-to-tr from-secondary-500 to-transparent rounded-full blur-3xl transform -translate-x-1/3 translate-y-1/3"></div>
      </div>

      <div className="relative z-10 mb-16 max-w-3xl">
        <div className="inline-flex items-center space-x-2 bg-red-50 rounded-full px-3 py-1 mb-6 border border-red-100">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span className="text-sm text-red-700 font-medium">The Current State</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
          The Discovery Experience is <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">Broken</span>
        </h2>
        <p className="text-xl text-slate-600 leading-relaxed">
          The $8.3T Silver Economy is being held back by a 15-year-old lead generation model that abuses families and taxes operators.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 relative z-10">
        {problems.map((item, index) => (
          <div 
            key={index} 
            className={`group bg-white p-8 rounded-2xl border border-slate-100 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${item.borderColor}`}
          >
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
              <item.icon className={`w-7 h-7 ${item.iconColor}`} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-4 group-hover:text-primary-600 transition-colors">{item.title}</h3>
            <p className="text-slate-600 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};