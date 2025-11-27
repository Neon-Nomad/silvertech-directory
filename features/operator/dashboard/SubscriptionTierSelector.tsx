import React from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface TierProps {
  name: string;
  price: string;
  features: string[];
  isPopular?: boolean;
  onSelect: () => void;
}

const Tier: React.FC<TierProps> = ({ name, price, features, isPopular, onSelect }) => (
  <div className={`bg-white rounded-2xl p-6 border ${isPopular ? 'border-primary-500 shadow-xl ring-2 ring-primary-200' : 'border-slate-200 shadow-sm'} relative flex flex-col`}>
    {isPopular && (
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white text-xs font-bold px-3 py-1 rounded-full">
        MOST POPULAR
      </div>
    )}
    <h3 className="text-lg font-bold text-slate-900 mb-2">{name}</h3>
    <div className="mb-6">
      <span className="text-3xl font-bold text-slate-900">{price}</span>
      {price !== 'Free' && <span className="text-slate-500">/mo</span>}
    </div>
    <ul className="space-y-3 mb-8 flex-1">
      {features.map((feature, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
          <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
          {feature}
        </li>
      ))}
    </ul>
    <button 
      className={`w-full py-3 px-6 rounded-md font-medium transition-colors ${isPopular ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'}`}
      onClick={onSelect}
    >
      Select {name}
    </button>
  </div>
);

export const SubscriptionTierSelector: React.FC = () => {
  return (
    <div className="py-12">
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Choose Your Growth Engine</h2>
        <p className="text-slate-600 max-w-2xl mx-auto">
          Scale your occupancy with our data-driven tools. No commissions, ever.
        </p>
      </div>
      
      <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto px-4">
        <Tier 
          name="Standard" 
          price="Free" 
          features={[
            "Basic Directory Listing",
            "Receive Inquiries via Email",
            "Monthly Performance Report",
            "Standard Support"
          ]}
          onSelect={() => alert('Selected Free Plan - Your account has been updated.')}
        />
        <Tier 
          name="Pro" 
          price="$299" 
          isPopular
          features={[
            "Priority Search Ranking",
            "Direct Lead Management CRM",
            "Real-Time Vacancy Updates",
            "Competitor Pricing Intel",
            "Verified Partner Badge"
          ]}
          onSelect={() => alert('Selected Pro Plan - Payment integration coming soon!')}
        />
        <Tier 
          name="AI Connect" 
          price="$499" 
          features={[
            "Everything in Pro",
            "AI Receptionist (24/7 Call Handling)",
            "Automated Tour Scheduling",
            "Sentiment Analysis on Reviews",
            "Dedicated Success Manager"
          ]}
          onSelect={() => alert('Selected AI Connect - Payment integration coming soon!')}
        />
      </div>
    </div>
  );
};
