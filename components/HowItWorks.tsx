import React from 'react';
import { Section } from './ui/Section';

export const HowItWorks: React.FC = () => {
  const steps = [
    { title: "Data Ingestion", desc: "SilverTech imports state licensing data to programmatically populate the directory." },
    { title: "Auto-Generation", desc: "Profiles are automatically generated for every licensed facility. No empty directory problem." },
    { title: "Operator Claim", desc: "Operators claim profiles to enhance listings and adopt free workflow tools." },
    { title: "Real-Time Sync", desc: "Inventory and pricing are managed live via the SaaS dashboard." },
    { title: "Consumer Search", desc: "Families use filters and AI guidance to find verified care options." },
    { title: "Intelligence Loop", desc: "Interaction data is captured and fed back into industry analytics." }
  ];

  return (
    <Section id="how-it-works" className="bg-slate-50">
      <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-16 text-center">How It Works</h2>
      
      <div className="relative max-w-4xl mx-auto">
        {/* Vertical Line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-slate-200 transform md:-translate-x-1/2"></div>
        
        <div className="space-y-12">
          {steps.map((step, index) => (
            <div key={index} className={`relative flex items-center ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
              
              {/* Timeline Dot */}
              <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full bg-primary-600 border-4 border-white shadow-sm transform -translate-x-1/2 z-10"></div>
              
              {/* Content */}
              <div className="ml-12 md:ml-0 md:w-1/2 p-6 md:px-12">
                <div className={`bg-white p-6 rounded-lg border border-slate-100 shadow-sm ${index % 2 === 0 ? 'md:text-left' : 'md:text-right'}`}>
                  <div className="text-xs font-bold text-primary-600 uppercase tracking-wider mb-2">Step 0{index + 1}</div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                  <p className="text-slate-600 text-sm">{step.desc}</p>
                </div>
              </div>
              
              {/* Spacer for alternating layout */}
              <div className="hidden md:block md:w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};