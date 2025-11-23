import React from 'react';
import { Section } from './ui/Section';
import { Layers, Bot, ShoppingBag, BarChart3, Check } from 'lucide-react';

export const BusinessModel: React.FC = () => {
  return (
    <Section id="business-model">
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Deep Business Model</h2>
        <p className="text-xl text-slate-600">Four integrated layers driving recurring revenue and compounding data value.</p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Layer 1 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
          <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center mb-6 text-blue-600">
            <Layers size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Layer 1: SaaS Core</h3>
          <p className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wide">Recurring Subscription</p>
          <ul className="space-y-3 mb-8 flex-grow">
            {['Tiered Pricing ($0 - $499+)', 'Pricing & Availability Control', 'CRM & Waitlist Manager', 'Multi-location Dashboard', 'Reputation Management'].map((feature, i) => (
              <li key={i} className="flex items-start text-sm text-slate-600">
                <Check className="w-4 h-4 text-blue-500 mr-2 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Layer 2 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full relative overflow-hidden">
          <div className="absolute top-0 right-0 bg-yellow-100 text-yellow-800 text-[10px] font-bold px-2 py-1 uppercase">High Margin</div>
          <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center mb-6 text-purple-600">
            <Bot size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Layer 2: AI Engine</h3>
          <p className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wide">Automation Add-ons</p>
          <ul className="space-y-3 mb-8 flex-grow">
            {['AI Phone Receptionist', 'AI Chat Assistant', 'Follow-up Sequencer', 'AI Family Q&A', 'Tour Reminders'].map((feature, i) => (
              <li key={i} className="flex items-start text-sm text-slate-600">
                <Check className="w-4 h-4 text-purple-500 mr-2 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Layer 3 */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
          <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center mb-6 text-green-600">
            <ShoppingBag size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Layer 3: Marketplace</h3>
          <p className="text-sm text-slate-500 font-medium mb-4 uppercase tracking-wide">Ancillary Revenue</p>
          <ul className="space-y-3 mb-8 flex-grow">
            {['Movers & Downsizing', 'Estate Lawyers', 'Medicare Advisory', 'Insurance Partners'].map((feature, i) => (
              <li key={i} className="flex items-start text-sm text-slate-600">
                <Check className="w-4 h-4 text-green-500 mr-2 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* Layer 4 */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-lg flex flex-col h-full text-white">
          <div className="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center mb-6 text-blue-400">
            <BarChart3 size={24} />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Layer 4: Data Intel</h3>
          <p className="text-sm text-slate-400 font-medium mb-4 uppercase tracking-wide">The Exit Play</p>
          <p className="text-sm italic text-slate-300 mb-4">"The Bloomberg Terminal for Senior Living"</p>
          <ul className="space-y-3 mb-8 flex-grow">
            {['Real-time Pricing APIs', 'Demand Heat Maps', 'Vacancy Insights', 'Sold to REITs & PE'].map((feature, i) => (
              <li key={i} className="flex items-start text-sm text-slate-300">
                <Check className="w-4 h-4 text-blue-400 mr-2 mt-0.5 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
};