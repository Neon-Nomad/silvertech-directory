import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Database, ShieldCheck, BadgeCheck, Gavel, Users, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export const MethodologyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-gray text-slate-900">
      <Helmet>
        <title>How We Compare | SilverTech Methodology</title>
        <meta
          name="description"
          content="Our transparency methodology explains how SilverTech sources, verifies, and ranks senior living facilities without referral fees."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/methodology" />
      </Helmet>

      <main className="max-w-5xl mx-auto px-6 py-12 space-y-12">
        <section>
          <p className="text-xs uppercase tracking-[0.3em] text-primary-600 font-semibold mb-3">
            Transparency Report
          </p>
          <h1 className="text-4xl md:text-5xl font-serif font-semibold leading-tight text-slate-900 mb-4">
            How We Compare Senior Living Communities
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed max-w-3xl">
            We publish our methodology so families understand exactly how we source data, verify facilities,
            and keep rankings independent of payments or referral fees.
          </p>
          <div className="mt-5 flex items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-primary-600" />
              Last updated: February 10, 2026
            </span>
          </div>
        </section>

        <section className="grid md:grid-cols-2 gap-6">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Database className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-serif font-semibold">Data Provenance</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              We aggregate public and verified private sources to build a consistent, statewide view of senior care
              options. Data is rechecked on a set cadence for accuracy.
            </p>
            <div className="text-xs uppercase tracking-widest text-primary-600 font-semibold">
              Sources: CMS, State Health Agencies, Verified Submissions
            </div>
          </Card>
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <BadgeCheck className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-serif font-semibold">Verified Badge</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              The Verified badge is earned through a five-point audit process that goes beyond marketing claims and
              checks for consistent care quality.
            </p>
            <ul className="text-sm text-slate-600 space-y-2">
              {[
                'Credential authentication',
                'Inspection record review',
                'Staffing consistency',
                'Family sentiment analysis'
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section className="bg-slate-900 text-white rounded-2xl p-8 md:p-10">
          <div className="flex items-center gap-3 mb-4">
            <Gavel className="w-6 h-6 text-primary-400" />
            <h2 className="text-2xl font-serif font-semibold">No Referral Fee Guarantee</h2>
          </div>
          <p className="text-white/80 leading-relaxed">
            We do not accept referral fees, commission checks, or pay-for-placement deals. Rankings are based on data,
            regulatory history, and verified facility details — never on payments.
          </p>
        </section>

        <section className="grid md:grid-cols-[1.1fr_1fr] gap-6 items-start">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-6 h-6 text-primary-600" />
              <h2 className="text-xl font-serif font-semibold">Research Team</h2>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Our team includes analysts, policy researchers, and care specialists focused on publishing accurate,
              actionable information for families.
            </p>
            <Button variant="outline" className="border-slate-300 hover:bg-slate-100">
              Meet the Research Team
            </Button>
          </Card>
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <h3 className="text-lg font-serif font-semibold mb-3">What this means for families</h3>
            <ul className="text-sm text-slate-600 space-y-2">
              <li>Clear, comparable listings across states.</li>
              <li>Transparency on licensing and oversight.</li>
              <li>No hidden incentives influencing placement.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};
