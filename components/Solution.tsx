import React from 'react';
import { Section } from './ui/Section';
import { Database, LayoutDashboard, LineChart, ShieldCheck } from 'lucide-react';

export const Solution: React.FC = () => {
  return (
    <Section id="solution">
      <div className="grid lg:grid-cols-2 gap-16 items-center">
        <div>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
            Not a Listing Site.<br />
            <span className="text-primary-600">A Vertical Operating System.</span>
          </h2>
          <p className="text-lg text-slate-600 mb-8 leading-relaxed">
            SilverTech Directory replaces the middleman with infrastructure. We connect supply and demand directly through a SaaS-enabled marketplace powered by real-time state licensing data.
          </p>

          <div className="space-y-6">
            {[
              { icon: Database, text: "Programmatically seeded marketplace using real state licensing data." },
              { icon: LayoutDashboard, text: "SaaS workflow tools for operators to manage inventory in real-time." },
              { icon: ShieldCheck, text: "Consumer-facing tool for transparency and verified decision-making." },
              { icon: LineChart, text: "The industry's first true demand-data intelligence layer." }
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-4">
                <div className="mt-1">
                  <item.icon className="w-6 h-6 text-primary-600" />
                </div>
                <p className="text-slate-700 font-medium">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary-100 to-slate-100 rounded-2xl transform rotate-3"></div>
          <div className="relative bg-slate-900 rounded-2xl p-8 shadow-2xl border border-slate-800 text-white">
            <div className="flex items-center justify-between mb-8 border-b border-slate-800 pb-4">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
              </div>
              <div className="text-xs text-slate-400 font-mono">silvertech_os_v1.0</div>
            </div>
            
            <div className="space-y-4 font-mono text-sm">
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Facilities</span>
                <span className="text-white">42,891</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Real-time Vacancy</span>
                <span className="text-green-400">12.4%</span>
              </div>
              <div className="h-px bg-slate-800 my-4"></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Inbound Leads</div>
                  <div className="text-lg font-bold">1,204</div>
                </div>
                <div className="bg-slate-800 p-3 rounded border border-slate-700">
                  <div className="text-xs text-slate-400 mb-1">Avg. Conversion</div>
                  <div className="text-lg font-bold text-primary-400">18.2%</div>
                </div>
              </div>
              <div className="bg-primary-900/30 p-4 rounded border border-primary-900/50 text-primary-200 text-xs">
                > System Recommendation: Demand spike in Zip 94103. Adjust pricing model +5%.
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};