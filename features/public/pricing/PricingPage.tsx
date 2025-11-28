import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Check, X, HelpCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Helmet>
        <title>Pricing | SilverTech Directory</title>
        <meta name="description" content="Provider pricing for SilverTech Directory. Transparent, commission-free senior living marketing tools." />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-6">
            Transparent Pricing for Senior Living Providers
          </h1>
          <div className="max-w-3xl mx-auto text-lg text-slate-600 space-y-4">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Basic Tier */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Basic Listing</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">Free</span>
              </div>
              <p className="text-slate-500 mt-2 text-sm">Essential visibility for every community.</p>
            </div>
            <div className="p-8 flex-1">
              <ul className="space-y-4">
                <FeatureItem text="Included in directory" included={true} />
                <FeatureItem text="Placement priority" included={false} />
                <FeatureItem text="Photos allowed" included={false} />
                <FeatureItem text="Pricing transparency badge" included={false} />
                <FeatureItem text="Schedule-a-Tour button" included={false} />
                <FeatureItem text="Dedicated lead email" included={false} />
                <FeatureItem text="Missed-call protection" included={false} />
                <FeatureItem text="AI call transcription" included={false} />
                <FeatureItem text="Lead scoring" included={false} />
                <FeatureItem text="Monthly PDF report" included={false} />
                <FeatureItem text="Virtual tour embed" included={false} />
                <FeatureItem text="Priority support" included={false} />
              </ul>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <Link to="/claim-business" className="block w-full py-3 px-4 bg-white border border-slate-300 rounded-lg text-slate-700 font-medium text-center hover:bg-slate-50 transition-colors">
                Claim Free Listing
              </Link>
            </div>
          </div>

          {/* Featured Tier */}
          <div className="bg-white rounded-2xl shadow-lg border border-primary-100 overflow-hidden flex flex-col relative transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-2 bg-primary-500" />
            <div className="p-8 border-b border-slate-100">
              <div className="text-primary-600 text-sm font-bold uppercase tracking-wide mb-2">Most Popular</div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Featured Listing</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">$99</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-slate-500 mt-2 text-sm">Enhanced visibility and engagement tools.</p>
            </div>
            <div className="p-8 flex-1">
              <ul className="space-y-4">
                <FeatureItem text="Included in directory" included={true} />
                <FeatureItem text="Placement priority" included={true} />
                <FeatureItem text="Photos allowed" included={true} />
                <FeatureItem text="Pricing transparency badge" included={true} />
                <FeatureItem text="Schedule-a-Tour button" included={true} />
                <FeatureItem text="Dedicated lead email" included={false} />
                <FeatureItem text="Missed-call protection" included={false} />
                <FeatureItem text="AI call transcription" included={false} />
                <FeatureItem text="Lead scoring" included={false} />
                <FeatureItem text="Monthly PDF report" included={false} />
                <FeatureItem text="Virtual tour embed" included={false} />
                <FeatureItem text="Priority support" included={true} />
              </ul>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <Link to="/login" className="block w-full py-3 px-4 bg-primary-600 rounded-lg text-white font-medium text-center hover:bg-primary-700 transition-colors shadow-md">
                Get Started
              </Link>
            </div>
          </div>

          {/* Lead Capture Suite */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="p-8 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Lead Capture Suite</h3>
              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-bold text-slate-900">$499</span>
                <span className="text-slate-500">/mo</span>
              </div>
              <p className="text-slate-500 mt-2 text-sm">Complete automation and lead management.</p>
            </div>
            <div className="p-8 flex-1">
              <ul className="space-y-4">
                <FeatureItem text="Included in directory" included={true} />
                <FeatureItem text="Placement priority" included={true} />
                <FeatureItem text="Photos allowed" included={true} />
                <FeatureItem text="Pricing transparency badge" included={true} />
                <FeatureItem text="Schedule-a-Tour button" included={true} />
                <FeatureItem text="Dedicated lead email" included={true} />
                <FeatureItem text="Missed-call protection" included={true} />
                <FeatureItem text="AI call transcription" included={true} />
                <FeatureItem text="Lead scoring" included={true} />
                <FeatureItem text="Monthly PDF report" included={true} />
                <FeatureItem text="Virtual tour embed" included={true} />
                <FeatureItem text="Priority support" included={true} />
              </ul>
            </div>
            <div className="p-8 bg-slate-50 border-t border-slate-100">
              <a href="mailto:sales@silvertechdirectory.com?subject=Inquiry about Lead Capture Suite" className="block w-full py-3 px-4 bg-slate-900 rounded-lg text-white font-medium text-center hover:bg-slate-800 transition-colors">
                Contact Sales
              </a>
            </div>
          </div>

        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-20 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Why Upgrade?</h2>
          <div className="grid gap-6">
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                What is "Missed-call protection"?
              </h3>
              <p className="text-slate-600">
                Our AI answers calls when your staff is busy, takes a message, and instantly texts you the lead details. You never lose a potential resident due to a busy signal.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg border border-slate-200">
              <h3 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-primary-500" />
                How does the "Placement Priority" work?
              </h3>
              <p className="text-slate-600">
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
  <li className={`flex items-start gap-3 text-sm ${included ? 'text-slate-700' : 'text-slate-400'}`}>
    {included ? (
      <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
    ) : (
      <X className="w-5 h-5 text-slate-300 flex-shrink-0" />
    )}
    <span>{text}</span>
  </li>
);
