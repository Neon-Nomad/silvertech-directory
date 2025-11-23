import React from 'react';
import { Section } from './ui/Section';

export const WhyNow: React.FC = () => {
  const stats = [
    { value: "10,000", label: "Boomers turning 65 daily" },
    { value: "$8.3T", label: "Silver Economy Value" },
    { value: "15 Years", label: "Tech lag in senior living" },
    { value: "Data Gap", label: "REITs lack demand visibility" }
  ];

  return (
    <Section dark className="bg-slate-900 border-y border-slate-800">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Now?</h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          A perfect storm of demographic inevitability and technological obsolescence.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
        {stats.map((stat, i) => (
          <div key={i} className="p-6">
            <div className="text-4xl md:text-5xl font-bold text-white mb-2">{stat.value}</div>
            <div className="text-sm md:text-base text-slate-400 font-medium uppercase tracking-wide">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="mt-16 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto text-slate-300 text-sm md:text-base leading-relaxed">
        <p>
          Families are becoming digitally native, demanding transparency and control. They no longer tolerate opaque, high-pressure sales tactics.
        </p>
        <p>
          Operators are suffering from critical labor shortages and marketing inefficiencies. They urgently need automation to survive.
        </p>
      </div>
    </Section>
  );
};