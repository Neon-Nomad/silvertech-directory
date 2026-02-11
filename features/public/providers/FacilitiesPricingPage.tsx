import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, BarChart3, ShieldCheck, Star, Headphones, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const FacilitiesPricingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-gray text-slate-900">
      <Helmet>
        <title>Pricing | SilverTech Partners</title>
        <meta
          name="description"
          content="Choose the SilverTech plan that fits your community. Transparent pricing, verified listings, and premium placement options."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/pricing" />
      </Helmet>

      <header className="sticky top-0 z-40 bg-warm-gray/95 backdrop-blur-md border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500 rounded-md flex items-center justify-center">
            <Building2 className="w-4 h-4 text-white" />
          </div>
          <span className="font-semibold text-lg tracking-tight">SilverTech</span>
        </div>
        <Button variant="outline" size="sm" className="px-4 py-2 text-xs uppercase tracking-widest border-slate-300" onClick={() => navigate('/for-facilities')}>
          Back
        </Button>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-slate-900 leading-tight mb-4">
            Choose Your Plan
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Transparent pricing for communities that value verified data, honest visibility, and qualified leads.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6 items-stretch">
          <Card className="border border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-lg">Free</span>
              <span className="text-xs uppercase tracking-widest text-slate-400">Standard listing</span>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Keep a basic presence in the directory while you evaluate the platform.
            </p>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>Basic facility details</li>
              <li>Standard search indexing</li>
              <li>Community profile page</li>
            </ul>
            <Button
              variant="outline"
              className="w-full mt-6 border-slate-300"
              onClick={() => navigate('/for-facilities#claim-listing')}
            >
              Claim Listing
            </Button>
          </Card>

          <Card className="border-2 border-primary-500 shadow-md bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="font-semibold text-lg text-primary-700">Premium</span>
              <span className="text-[10px] uppercase tracking-widest bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                Most Popular
              </span>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Upgrade for verified visibility, higher placement, and actionable lead insights.
            </p>
            <ul className="text-sm text-slate-700 space-y-2">
              <li className="flex items-center gap-2"><BadgeCheck className="w-4 h-4 text-primary-600" /> Verified partner badge</li>
              <li className="flex items-center gap-2"><Star className="w-4 h-4 text-primary-600" /> Priority placement</li>
              <li className="flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary-600" /> Lead analytics dashboard</li>
              <li className="flex items-center gap-2"><Headphones className="w-4 h-4 text-primary-600" /> Dedicated success manager</li>
              <li className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-primary-600" /> Verified pricing support</li>
            </ul>
            <Button
              variant="primary"
              className="w-full mt-6"
              onClick={() => navigate('/for-facilities#claim-listing')}
            >
              Start Premium
            </Button>
          </Card>
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-primary-400" />
            <h2 className="text-2xl font-serif font-semibold">Why partners choose SilverTech</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            We focus on trust, verified data, and measurable outcomes — not pay-to-play rankings. Every upgrade improves
            transparency for families and quality leads for your team.
          </p>
        </section>
      </main>
    </div>
  );
};
