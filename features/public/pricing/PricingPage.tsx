import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, X, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-white font-sans">
      <Helmet>
        <title>Pricing | SilverTech Directory</title>
        <meta name="description" content="Provider pricing for SilverTech Directory. Transparent, commission-free senior living marketing tools." />
        <link rel="canonical" href="https://silvertechdirectory.com/pricing" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Pricing | SilverTech Directory" />
        <meta property="og:description" content="Provider pricing for SilverTech Directory. Transparent, commission-free senior living marketing tools." />
        <meta property="og:url" content="https://silvertechdirectory.com/pricing" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Pricing | SilverTech Directory" />
        <meta name="twitter:description" content="Provider pricing for SilverTech Directory. Transparent, commission-free senior living marketing tools." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-warm-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-charcoal mb-6">
            Transparent Pricing for Senior Living Providers
          </h1>
          <div className="max-w-3xl mx-auto text-lg text-charcoal/70 space-y-4">
            <p className="font-medium text-primary-700">
              SilverTech Directory is completely free for families.
            </p>
            <p>
              Every senior living community in the country receives a basic listing at no cost.
              We believe eldercare should be transparent and searchable, without forcing families into sales funnels or commission-based systems.
            </p>
            <p className="text-base">
              Communities may upgrade their listings only if they want additional visibility or operational tools.
              Upgrades never affect how families use the site. They simply give providers optional advantages:
              photos, analytics, lead protection, and AI-assisted call handling.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">

          {/* Free Tier */}
          <div className="bg-white rounded-2xl shadow-sm border border-warm-gray overflow-hidden flex flex-col">
            <div className="p-8 border-b border-warm-gray">
              <h3 className="text-xl font-bold text-charcoal mb-2">Free Listing</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-charcoal">Free</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warm-gray text-charcoal">
                Free Forever
              </div>
              <p className="text-charcoal/60 mt-2 text-sm">Essential visibility for every community.</p>
            </div>
            <div className="p-8 flex-1">
              <ul className="space-y-3">
                <FeatureItem text="Basic directory listing" included={true} />
                <FeatureItem text="Contact information displayed" included={true} />
                <FeatureItem text="Standard search visibility" included={true} />
                <FeatureItem text="Photos" included={false} />
                <FeatureItem text="Enhanced placement" included={false} />
              </ul>
            </div>
            <div className="p-8 bg-warm-white border-t border-warm-gray">
              <Link to="/claim-business" className="block w-full py-3 px-4 bg-white border border-warm-gray rounded-lg text-charcoal font-medium text-center hover:bg-warm-white transition-colors">
                Claim Free Listing
              </Link>
            </div>
          </div>

          {/* Featured Tier $99 */}
          <div className="bg-white rounded-2xl shadow-sm border border-primary-200 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-warm-gray">
              <div className="text-primary-600 text-xs font-bold uppercase tracking-wide mb-2">Popular</div>
              <h3 className="text-xl font-bold text-charcoal mb-2">Featured Listing</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-charcoal">$99</span>
                <span className="text-charcoal/60">/mo</span>
              </div>
              <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-primary-100 text-primary-800 border border-primary-200">
                15-Day Free Trial
              </div>
              <p className="text-charcoal/60 mt-2 text-sm">Up to 3 facility profiles</p>
            </div>
            <div className="p-8 flex-1">
              <ul className="space-y-3">
                <FeatureItem text="Enhanced search placement" included={true} />
                <FeatureItem text="Photo gallery (10 photos)" included={true} />
                <FeatureItem text="Pricing transparency badge" included={true} />
                <FeatureItem text="Schedule-a-Tour button" included={true} />
                <FeatureItem text="Basic analytics dashboard" included={true} />
                <FeatureItem text="Priority support" included={true} />
              </ul>
            </div>
            <div className="p-8 bg-warm-white border-t border-warm-gray">
              <a href="https://buy.stripe.com/eVqaEZ9gIaQwe6d15AcV201" className="block w-full py-3 px-4 bg-primary-600 rounded-lg text-white font-medium text-center hover:bg-primary-700 transition-colors shadow-md">
                Subscribe Now
              </a>
            </div>
          </div>

          {/* Priority Tier $299 */}
          <div className="bg-white rounded-2xl shadow-sm border border-warm-gray overflow-hidden flex flex-col">
            <div className="p-8 border-b border-warm-gray">
              <h3 className="text-xl font-bold text-charcoal mb-2">Priority Listing</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-charcoal">$299</span>
                <span className="text-charcoal/60">/mo</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                15-Day Free Trial
              </div>
              <p className="text-charcoal/60 mt-2 text-sm">Up to 10 facility profiles</p>
            </div>
            <div className="p-8 flex-1">
              <ul className="space-y-3">
                <FeatureItem text="Top search placement" included={true} />
                <FeatureItem text="Unlimited photos & tours" included={true} />
                <FeatureItem text="Advanced analytics & PDF reports" included={true} />
                <FeatureItem text="Featured in city/state pages" included={true} />
                <FeatureItem text="Dedicated lead email" included={true} />
                <FeatureItem text="Priority support" included={true} />
              </ul>
            </div>
            <div className="p-8 bg-warm-white border-t border-warm-gray">
              <a href="https://buy.stripe.com/fZubJ350scYEfah7tYcV202" className="block w-full py-3 px-4 bg-charcoal rounded-lg text-white font-medium text-center hover:bg-black transition-colors">
                Subscribe Now
              </a>
            </div>
          </div>

          {/* Lead Capture Suite $499 */}
          <div className="bg-white rounded-2xl shadow-lg border-2 border-primary-300 overflow-hidden flex flex-col relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-600 to-primary-600" />
            <div className="p-8 border-b border-warm-gray">
              <div className="text-primary-600 text-xs font-bold uppercase tracking-wide mb-2">Best Value</div>
              <h3 className="text-xl font-bold text-charcoal mb-2">Lead Capture Suite</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-charcoal">$499</span>
                <span className="text-charcoal/60">/mo</span>
              </div>
              <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                15-Day Free Trial
              </div>
              <p className="text-charcoal/60 mt-2 text-sm">Up to 25 facility profiles</p>
            </div>
            <div className="p-8 flex-1">
              <ul className="space-y-3">
                <FeatureItem text="Premium top placement" included={true} />
                <FeatureItem text="AI Missed Call Integration" included={true} />
                <FeatureItem text="AI call transcription & scoring" included={true} />
                <FeatureItem text="Automatic SMS notifications" included={true} />
                <FeatureItem text="CRM integration support" included={true} />
                <FeatureItem text="Dedicated account manager" included={true} />
                <FeatureItem text="24/7 priority support" included={true} />
              </ul>
            </div>
            <div className="p-8 bg-warm-white border-t border-warm-gray">
              <a href="https://buy.stripe.com/28EdRbfF65wc8LTbKecV203" className="block w-full py-3 px-4 bg-gradient-to-r from-primary-600 to-primary-600 rounded-lg text-white font-medium text-center hover:from-primary-700 hover:to-primary-700 transition-colors shadow-lg">
                Subscribe Now
              </a>
            </div>
          </div>

        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-charcoal mb-8 text-center">Why Upgrade?</h2>
          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-lg border border-warm-gray">
              <h3 className="font-bold text-charcoal mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                What is "Missed-call protection"?
              </h3>
              <p className="text-charcoal/70">
                Our AI answers calls when your staff is busy, takes a message, and instantly texts you the lead details. You never lose a potential resident due to a busy signal.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-warm-gray">
              <h3 className="font-bold text-charcoal mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                How does the "Placement Priority" work?
              </h3>
              <p className="text-charcoal/70">
                Featured listings appear above basic listings in search results for your city and state, increasing your visibility to families searching in your area.
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

const FeatureItem: React.FC<{ text: string; included: boolean }> = ({ text, included }) => (
  <li className={`flex items-start gap-3 text-sm ${included ? 'text-charcoal' : 'text-charcoal/40'}`}>
    {included ? (
      <Check className="w-5 h-5 text-primary-500 flex-shrink-0" />
    ) : (
      <X className="w-5 h-5 text-charcoal/30 flex-shrink-0" />
    )}
    <span>{text}</span>
  </li>
);
