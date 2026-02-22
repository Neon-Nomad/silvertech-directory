import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  ShieldCheck,
  Star,
  TrendingUp,
  Building2,
  Sparkles,
  Target,
  Crown,
  Lock,
  UserCheck,
  Zap,
  LayoutGrid,
  ArrowRight,
} from 'lucide-react';

// Unified plans, taken from the for-facilities page as the source of truth.
const plans = [
  {
    name: 'Protector',
    price: { monthly: 99 },
    href: '/claim-business?plan=featured',
    description: 'Defend your brand and prove direct demand with attribution.',
    features: [
      { text: 'Verified Representative badge', icon: <UserCheck className="h-5 w-5" /> },
      { text: 'Brand Protection (removes stale warning)', icon: <ShieldCheck className="h-5 w-5" /> },
      { text: 'Attribution Suite with Verified Unique Interest', icon: <BarChart3 className="h-5 w-5" /> },
    ],
    mostPopular: false,
  },
  {
    name: 'Accelerator',
    price: { monthly: 249 },
    href: '/claim-business?plan=priority',
    description: 'Hunt new demand and improve conversion velocity.',
    features: [
      { text: 'No-results demand feed + Express Interest', icon: <TrendingUp className="h-5 w-5" /> },
      { text: 'Priority ranking via profile health score', icon: <Star className="h-5 w-5" /> },
      { text: 'Schedule a Tour CTA on search cards', icon: <Target className="h-5 w-5" /> },
      { text: 'All Protector features included', icon: <BadgeCheck className="h-5 w-5" /> },
    ],
    mostPopular: true,
  },
  {
    name: 'Dominator',
    price: { monthly: 499 },
    href: '/claim-business?plan=lead_suite',
    description: 'Operate with market intelligence and custom value proofs.',
    features: [
      { text: 'Competitive comparison intelligence', icon: <BarChart3 className="h-5 w-5" /> },
      { text: 'Custom ROI modeling from actual rent', icon: <Crown className="h-5 w-5" /> },
      { text: 'Featured authority with pinned and recommended Q&A', icon: <LayoutGrid className="h-5 w-5" /> },
      { text: 'All Accelerator features included', icon: <BadgeCheck className="h-5 w-5" /> },
    ],
    mostPopular: false,
  },
];

export const PricingPage: React.FC = () => {
  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-900 font-sans text-white">
      <Helmet>
        <title>Pricing | SilverTech Directory</title>
        <meta name="description" content="Transparent, commission-free pricing for senior living providers. Attract more families and streamline operations." />
        <link rel="canonical" href="https://silvertechdirectory.com/pricing" />
      </Helmet>

      {/* Background Aurora */}
      <div className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden">
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[150%]">
          <div className="absolute w-full h-full inset-0 bg-[radial-gradient(circle_400px_at_50%_300px,#3b82f640,transparent)]"></div>
          <div className="absolute w-full h-full inset-0 bg-[radial-gradient(circle_400px_at_50%_800px,#a855f750,transparent)] opacity-70"></div>
        </div>
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center">
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl bg-clip-text text-transparent bg-gradient-to-b from-white/90 to-white/60">
            Simple, Transparent Pricing
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-lg text-slate-300">
            100% free for families. Powerful, commission-free tools for our facility partners.
          </p>
        </div>
        
        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan) => (
              <div 
                key={plan.name} 
                className={`relative flex flex-col rounded-3xl p-8 transition-transform duration-300 ease-in-out hover:scale-[1.03]
                  ${plan.mostPopular 
                    ? 'bg-slate-800/50 border-2 border-primary-500/80 shadow-[0_0_30px_theme(colors.primary.500/0.4)]' 
                    : 'bg-slate-900/50 border border-white/20'
                  }
                  ${!plan.mostPopular ? 'backdrop-blur-xl' : 'backdrop-blur-2xl'}`
                }>

                {plan.mostPopular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <div className="flex items-center gap-x-2 rounded-full bg-primary-500 px-4 py-1.5 text-sm font-semibold text-white shadow-md">
                          <Star className="h-4 w-4" />
                          Most Popular
                      </div>
                  </div>
                )}
                
                <div className="flex-1">
                  <h3 className="text-xl font-semibold leading-7 text-white">{plan.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{plan.description}</p>
                  
                  <div className="mt-6 flex items-baseline gap-x-2">
                    <span className="text-5xl font-bold tracking-tight text-white">${plan.price.monthly}</span>
                    <span className="text-base font-semibold leading-7 text-slate-300">/month</span>
                  </div>
                  
                  <ul role="list" className="mt-8 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature.text} className="flex items-center gap-x-3">
                        <div className={`flex h-7 w-7 flex-none items-center justify-center rounded-lg ${plan.mostPopular ? 'bg-primary-500/20 text-primary-400' : 'bg-white/10 text-slate-300'}`}>
                          {feature.icon}
                        </div>
                        <span className="text-sm leading-6 text-slate-200">{feature.text}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link 
                  to={plan.href} 
                  className={`mt-8 block rounded-lg py-3 px-3.5 text-center text-sm font-semibold transition-colors
                    ${plan.mostPopular 
                      ? 'bg-gradient-to-br from-primary-500 to-blue-500 text-white shadow-lg hover:from-primary-600' 
                      : 'bg-white/10 text-white hover:bg-white/20'}`
                  }>
                  Get Started
                </Link>
              </div>
            ))}
          </div>
        </div>
        
        {/* Free Plan Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="bg-slate-900/50 border border-white/20 backdrop-blur-xl rounded-3xl p-8 text-center grid lg:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                    Every Community Gets a Free Listing
                  </h2>
                  <p className="mt-4 text-lg text-slate-300">
                    Maintain a basic presence and engage with our platform at no cost.
                  </p>
                  <ul className="mt-6 space-y-4 text-left">
                    <li className="flex gap-x-3 items-center">
                        <BadgeCheck className="h-6 w-6 flex-none text-white/50" />
                        <span className="text-slate-200">Basic facility details & contact info</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                        <Lock className="h-6 w-6 flex-none text-white/50" />
                        <span className="text-slate-200">Standard search indexing & Public Transparency Score</span>
                    </li>
                    <li className="flex gap-x-3 items-center">
                        <Zap className="h-6 w-6 flex-none text-white/50" />
                        <span className="text-slate-200">Lead Pulse visibility after claim login</span>
                    </li>
                  </ul>
                </div>
                <div className="mt-8 lg:mt-0">
                    <h3 className="text-xl font-semibold text-white">Claim Your Free Listing</h3>
                    <p className="mt-2 text-slate-300">Verify your community's information and start connecting with families today.</p>
                    <Link to="/claim-business" className="mt-6 inline-flex items-center gap-x-2 rounded-lg py-3 px-4 text-sm font-semibold transition-colors bg-white/10 text-white hover:bg-white/20">
                        Claim Now <ArrowRight className="h-4 w-4" />
                    </Link>
                </div>
            </div>
        </div>

        {/* Why Partners Choose Us */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
            <div className="bg-slate-900/50 border border-white/20 backdrop-blur-xl rounded-3xl p-8 flex flex-col sm:flex-row items-center gap-8">
                <div className="flex-shrink-0">
                    <Sparkles className="w-12 h-12 text-primary-400" />
                </div>
                <div>
                    <h2 className="text-2xl font-semibold text-white">Why partners choose SilverTech</h2>
                    <p className="mt-2 text-slate-300 leading-relaxed">
                        We focus on trust, verified data, and measurable outcomes — not pay-to-play rankings. Every upgrade improves transparency for families and provides quality leads for your team.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
