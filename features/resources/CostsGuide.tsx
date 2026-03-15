import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const CostsGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-white text-charcoal">
      <Helmet>
        <title>What Senior Living Costs Include | SilverTech</title>
        <meta
          name="description"
          content="Understand the components of senior living costs, care tiers, and common add-ons so you can compare communities fairly."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/guides/what-it-costs" />
      </Helmet>

      <main className="max-w-[920px] mx-auto px-6 py-16">
        <nav className="text-xs text-slate-400 uppercase tracking-widest mb-6">
          <Link to="/" className="hover:text-gold">Home</Link> <span className="mx-2">/</span>
          <Link to="/resources/guides" className="hover:text-gold">Resources</Link> <span className="mx-2">/</span>
          <span className="text-slate-500">What It Costs</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
          What Senior Living Costs Include
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          Costs vary by care level, staffing intensity, and services. This guide helps you compare
          apples-to-apples across communities.
        </p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-2">Core monthly costs</h2>
            <p className="text-slate-600 leading-relaxed">
              Most communities bundle housing, meals, utilities, and baseline care. Ask what is
              truly included and what is billed separately.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Care tiers and add-ons</h2>
            <p className="text-slate-600 leading-relaxed">
              Care level changes are the biggest driver of monthly cost shifts. Clarify how care
              tiers are assessed and how often they change.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Room types and availability</h2>
            <p className="text-slate-600 leading-relaxed">
              Studio vs. one-bedroom, shared rooms, and premium locations can materially change the
              monthly rate.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Financial assistance</h2>
            <p className="text-slate-600 leading-relaxed">
              Medicaid, VA benefits, and long-term care insurance can reduce out-of-pocket costs.
              Verify eligibility rules for your state and facility type.
            </p>
          </div>
        </section>

        <div className="mt-12 p-6 bg-warm-gray border border-slate-200 rounded-xl">
          <h3 className="font-bold text-lg mb-2">Need more help?</h3>
          <p className="text-slate-600 mb-4">
            Jump straight to official regulations, licensing, and state resources.
          </p>
          <Link
            to="/regulations/"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-charcoal text-charcoal font-bold rounded-lg hover:bg-charcoal hover:text-white transition-all"
          >
            Go to Regulations
          </Link>
        </div>
      </main>
    </div>
  );
};
