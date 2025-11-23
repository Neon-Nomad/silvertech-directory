import React from 'react';
import { Section } from './ui/Section';
import { X, Check } from 'lucide-react';

export const Comparison: React.FC = () => {
  const features = [
    { name: "Business Model", legacy: "High Commissions (100% of 1st mo)", silver: "Zero Commission / SaaS" },
    { name: "Transparency", legacy: "Opaque Pricing", silver: "Transparency-First" },
    { name: "Data Accuracy", legacy: "Manual Updates", silver: "Real-Time / State Data" },
    { name: "Technology", legacy: "Call Centers", silver: "AI-Powered Workflow" },
    { name: "Scale", legacy: "Sales-Driven", silver: "Programmatic SEO" }
  ];

  return (
    <Section className="bg-slate-50">
      <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">Competitive Advantage</h2>
      
      <div className="overflow-hidden bg-white rounded-xl shadow-sm border border-slate-200">
        <div className="grid grid-cols-3 bg-slate-50 p-6 border-b border-slate-200">
          <div className="font-medium text-slate-500">Feature</div>
          <div className="font-bold text-slate-900 text-center">Legacy Incumbents</div>
          <div className="font-bold text-primary-600 text-center">SilverTech</div>
        </div>
        
        {features.map((item, index) => (
          <div key={index} className="grid grid-cols-3 p-6 border-b border-slate-100 hover:bg-slate-50/50 transition-colors items-center">
            <div className="font-medium text-slate-700">{item.name}</div>
            <div className="text-center text-slate-500 text-sm flex flex-col items-center">
               <span className="mb-1">{item.legacy}</span>
               <X className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-center text-slate-900 font-semibold text-sm flex flex-col items-center">
              <span className="mb-1">{item.silver}</span>
              <Check className="w-4 h-4 text-green-500" />
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};