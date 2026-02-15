import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  BadgeCheck,
  BarChart3,
  ShieldCheck,
  Star,
  TrendingUp,
  Target,
  Crown,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const FacilitiesPartnerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-warm-gray text-slate-900">
      <Helmet>
        <title>For Facilities | SilverTech Partners</title>
        <meta
          name="description"
          content="Partner with SilverTech to grow your senior living community with integrity, transparency, and verified pricing."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/for-facilities" />
      </Helmet>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <section className="text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-semibold text-slate-900 leading-tight mb-4">
            Grow Your Community with <span className="text-primary-600">Integrity</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            The premium directory for senior care facilities that value transparency, verified data, and honest partnerships.
          </p>
        </section>

        <section className="grid md:grid-cols-2 gap-6 items-center">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-slate-200">
            <img
              src="/images/hero_image.jpeg"
              alt="Senior living community"
              className="w-full h-64 object-cover"
              loading="eager"
              decoding="async"
            />
          </div>
          <Card>
            <h2 className="text-2xl font-serif font-semibold mb-4">Listing Tiers</h2>
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold">Free Hook</span>
                  <span className="text-xs uppercase tracking-widest text-slate-400">
                    Standard listing
                  </span>
                </div>
                <ul className="text-sm text-slate-600 space-y-2">
                  <li>Basic facility details</li>
                  <li>Standard search indexing</li>
                  <li>Public Transparency Score on your profile</li>
                  <li>Lead Pulse visibility after claim login</li>
                </ul>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-900">Protector</span>
                  <span className="text-xs font-semibold text-slate-500">$99/mo</span>
                </div>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <BadgeCheck className="w-4 h-4 text-primary-600" /> Verified Representative badge
                  </li>
                  <li className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-primary-600" /> Removes inactive warning via brand
                    protection
                  </li>
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-600" /> Attribution Suite with Verified Unique Interest from phone,
                    directions, and comparison signals
                  </li>
                </ul>
              </div>
              <div className="border-2 border-primary-500 rounded-lg p-5 bg-white shadow-md">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-primary-700">Accelerator</span>
                  <span className="text-[10px] uppercase tracking-widest bg-primary-100 text-primary-700 px-2 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center gap-2"><TrendingUp className="w-4 h-4 text-primary-600" /> No-results demand feed with Express Interest</li>
                  <li className="flex items-center gap-2"><Star className="w-4 h-4 text-primary-600" /> Priority search ranking via profile health score</li>
                  <li className="flex items-center gap-2"><Target className="w-4 h-4 text-primary-600" /> Schedule a Tour CTA on search result cards</li>
                </ul>
                <p className="mt-3 text-xs text-slate-500">$249/mo</p>
              </div>
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-semibold text-slate-900">Dominator</span>
                  <span className="text-xs font-semibold text-slate-500">$499/mo</span>
                </div>
                <ul className="text-sm text-slate-700 space-y-2">
                  <li className="flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-primary-600" /> Market intelligence for local comparison
                    behavior
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-primary-600" /> Custom ROI modeling using your real rent
                    inputs
                  </li>
                  <li className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-primary-600" /> Featured authority with pinned FAQs and
                    recommended answers
                  </li>
                </ul>
                <Button
                  variant="primary"
                  className="w-full mt-4"
                  onClick={() => navigate('/claim-business')}
                >
                  Claim and Upgrade
                </Button>
              </div>
            </div>
          </Card>
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-4">
            <ShieldCheck className="w-6 h-6 text-primary-400" />
            <h2 className="text-2xl font-serif font-semibold">The Transparency Pledge</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            Premium partners commit to verified pricing and availability. We never manipulate reviews or hide data for profit.
          </p>
        </section>

        <section id="claim-listing">
          <Card>
            <h2 className="text-2xl font-serif font-semibold mb-2">Claim Your Listing</h2>
            <p className="text-sm text-slate-600 mb-6">
              Fill out the form below to begin your partnership and verify your community.
            </p>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Facility Name
                </label>
                <input className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="Whispering Oaks Gardens" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Owner / Administrator Name
                </label>
                <input className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="John Doe" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Work Email
                </label>
                <input type="email" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="admin@facility.com" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">
                  Phone Number
                </label>
                <input type="tel" className="w-full border border-slate-200 rounded-lg px-4 py-3 text-sm" placeholder="(555) 000-0000" />
              </div>
              <Button type="submit" variant="primary" className="w-full">Partner With Us</Button>
            </form>
            <p className="text-[10px] text-slate-400 text-center mt-4">
              By submitting, you agree to our Terms and Privacy Policy. Our team will verify credentials within 24 hours.
            </p>
          </Card>
        </section>
      </main>
    </div>
  );
};
