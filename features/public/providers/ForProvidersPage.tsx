import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  CheckCircle,
  XCircle,
  ArrowRight,
  BarChart3,
  DollarSign,
  MessageSquare,
  TrendingUp,
} from 'lucide-react';

const FEATURES = [
  {
    icon: BarChart3,
    title: 'Family Journey',
    description:
      'Track the Family Journey from first look to tour request with Verified Unique Interest and honest counting.',
  },
  {
    icon: DollarSign,
    title: 'Broker-Free Value',
    description:
      "Weighted model estimates what you'd pay a broker for the same leads. Adjust the baseline to your market.",
  },
  {
    icon: MessageSquare,
    title: 'Verified Q&A',
    description:
      'Answer community questions as a Verified Representative. Premium answers rank higher and build trust with families.',
  },
  {
    icon: Shield,
    title: 'Profile Health Score',
    description:
      'Completeness checklist covering photos, care types, licensing, phone, website, and Q&A response rate.',
  },
  {
    icon: Users,
    title: 'No-Results Demand',
    description:
      'See anonymized families searching where no listing exists yet. Express interest to claim that demand before competitors.',
  },
  {
    icon: TrendingUp,
    title: 'Peer Benchmarking',
    description:
      'Compare your weekly signals against city peers. Know where you stand without revealing competitor data.',
  },
];

const TIER_STACK = [
  {
    name: 'Protector',
    price: '$99/mo',
    goal: 'Brand defense and verified credibility.',
    points: [
      'Verified Representative badge',
      'Brand Protection removes stale warning after inactivity',
      'Attribution Suite with Verified Unique Interest (phone reveals, map clicks, and comparisons)',
    ],
  },
  {
    name: 'Accelerator',
    price: '$249/mo',
    goal: 'Active lead acquisition and market hunting.',
    points: [
      'No-Results Demand Feed with Express Interest',
      'Priority ranking based on Health Score',
      'Schedule a Tour CTA on search cards',
    ],
  },
  {
    name: 'Dominator',
    price: '$499/mo',
    goal: 'Market intelligence and competitive dominance.',
    points: [
      'Competitive comparison intelligence',
      'Custom ROI modeling based on actual rent inputs',
      'Featured authority with pinned FAQs and recommended city-wide answers',
    ],
  },
];

export const ForProvidersPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans">
      <Helmet>
        <title>For Providers | SilverTech Directory</title>
        <meta
          name="description"
          content="Join the ethical alternative to senior living referral agencies. Zero commissions, attributed leads, and complete transparency."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/providers" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="For Providers | SilverTech Directory" />
        <meta
          property="og:description"
          content="Join the ethical alternative to senior living referral agencies. Zero commissions, attributed leads, and complete transparency."
        />
        <meta property="og:url" content="https://silvertechdirectory.com/providers" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="For Providers | SilverTech Directory" />
        <meta
          name="twitter:description"
          content="Join the ethical alternative to senior living referral agencies. Zero commissions, attributed leads, and complete transparency."
        />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      {/* Hero */}
      <div className="bg-slate-900 text-white pt-24 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
            The Ethical Alternative to <br className="hidden md:block" />
            <span className="text-primary-400">Referral Agencies</span>
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 max-w-3xl mx-auto mb-10">
            See every phone reveal, tour request, and comparison — no commissions, ever.
            <br />
            We connect families directly to you, then show you exactly what that connection is worth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              to="/claim-business"
              className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors shadow-lg shadow-primary-900/50"
            >
              Claim Free Profile
            </Link>
            <Link
              to="/pricing"
              className="bg-transparent border-2 border-slate-600 hover:border-white text-white px-8 py-4 rounded-lg text-lg font-bold transition-colors"
            >
              View Plans & Pricing
            </Link>
          </div>
        </div>
      </div>

      {/* The Broker Model vs SilverTech */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">Why SilverTech Exists</h2>
            <p className="text-lg text-slate-600 leading-relaxed">
              Families are sold as leads. Providers lose $4,500+ per placement to commission-based
              brokers. We built a transparent alternative where you own every relationship from day
              one — and we prove the value with real data, not promises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="text-2xl font-bold text-red-600 mb-6 flex items-center gap-3">
                <XCircle className="w-8 h-8" />
                The Broker Model
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>Charge 100-120% of first month's rent per placement</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>Gatekeep family contact info until you pay</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>"Speed to lead" wars that harass families</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-1" />
                  <span>Pay-to-play rankings hidden from users</span>
                </li>
              </ul>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-xl border border-primary-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-primary-500" />
              <h3 className="text-2xl font-bold text-primary-700 mb-6 flex items-center gap-3">
                <CheckCircle className="w-8 h-8" />
                The SilverTech Way
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>Zero commissions. Ever.</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>
                    Families reveal your phone number directly — you see the signal instantly
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>
                    Search ranking based on profile completeness and verified content, not spend
                  </span>
                </li>
                <li className="flex items-start gap-3 text-slate-700">
                  <CheckCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-1" />
                  <span>
                    Free tier includes full attribution. Premium unlocks verified answers and demand
                    feed.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* What You Actually Get */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            What You Actually Get
          </h2>
          <p className="text-lg text-slate-600 text-center mb-16 max-w-2xl mx-auto">
            Not vague promises — real tools built into your dashboard from day one.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="p-6 rounded-2xl border border-slate-200 hover:border-primary-200 hover:shadow-lg transition-all"
                >
                  <div className="w-12 h-12 bg-primary-100 text-primary-600 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-4">
            Plans Built For Growth
          </h2>
          <p className="text-lg text-slate-600 text-center mb-10 max-w-3xl mx-auto">
            Every listing starts with a Free Hook: standard indexing, a public Transparency Score,
            and Lead Pulse visibility when you claim your profile.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {TIER_STACK.map((tier) => (
              <div key={tier.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-slate-900">{tier.name}</h3>
                  <span className="text-sm font-semibold text-primary-700">{tier.price}</span>
                </div>
                <p className="text-sm text-slate-600 mb-4">{tier.goal}</p>
                <ul className="space-y-2 text-sm text-slate-700">
                  {tier.points.map((point) => (
                    <li key={point} className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-primary-500 mt-0.5 flex-shrink-0" />
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-0.5 bg-slate-700 -z-10" />

            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">
                1
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Claim Profile</h3>
              <p className="text-slate-400 text-center text-sm">
                Find your community and claim ownership. It's completely free.
              </p>
            </div>
            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">
                2
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Complete Your Profile</h3>
              <p className="text-slate-400 text-center text-sm">
                Add photos, care types, and licensing. Watch your Health Score climb.
              </p>
            </div>
            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">
                3
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Get Attributed Leads</h3>
              <p className="text-slate-400 text-center text-sm">
                Every phone reveal, direction click, and tour request lands in your dashboard.
              </p>
            </div>
            <div className="relative">
              <div className="w-24 h-24 bg-slate-800 border-4 border-slate-900 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-primary-400 z-10">
                4
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Upgrade When Ready</h3>
              <p className="text-slate-400 text-center text-sm">
                Unlock verified Q&A, demand feed, and broker-free value modeling.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-24 bg-primary-600 text-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to take back control?</h2>
          <p className="text-xl text-primary-100 mb-10">
            Join providers who are saying no to commissions and yes to transparency.
          </p>
          <Link
            to="/claim-business"
            className="inline-flex items-center bg-white text-primary-700 px-8 py-4 rounded-lg text-lg font-bold hover:bg-slate-50 transition-colors"
          >
            Claim Your Free Profile <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
};


