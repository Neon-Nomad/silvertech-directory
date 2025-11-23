import React from 'react';
import { Section } from './ui/Section';
import { AlertTriangle, DollarSign, Search, XCircle } from 'lucide-react';

export const Problem: React.FC = () => {
  const problems = [
    {
      icon: DollarSign,
      title: "Predatory Economics",
      description: "Referral agencies charge 100% of the first month's rent ($5k–$10k) per move-in. This incentivizes pushing families to the highest bidder, not the best care."
    },
    {
      icon: XCircle,
      title: "Broken Workflow",
      description: "Supply-side operators lack digital tools. They rely on spreadsheets and fax machines, leading to lost leads and inaccurate vacancy data."
    },
    {
      icon: Search,
      title: "Zero Transparency",
      description: "Families face opaque pricing and confusing options. They are overwhelmed by aggressive sales calls from lead aggregators selling their data."
    }
  ];

  return (
    <Section id="problem" className="bg-slate-50">
      <div className="mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">The Discovery Experience is Broken</h2>
        <p className="text-xl text-slate-600 max-w-2xl">
          The $8.3T Silver Economy is being held back by a 15-year-old lead generation model that abuses families and taxes operators.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {problems.map((item, index) => (
          <div key={index} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center mb-6">
              <item.icon className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
            <p className="text-slate-600 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};