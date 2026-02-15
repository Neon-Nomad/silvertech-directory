import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { AlertTriangle, BadgeCheck, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';

export const WhyThisExistsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet>
        <title>Why This Exists | SilverTech Directory</title>
        <meta
          name="description"
          content="Why SilverTech exists: a family-first, commission-free senior living directory focused on transparent data and direct community connection."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/why-this-exists" />
      </Helmet>

      <section className="bg-white border-b border-warm-gray">
        <div className="max-w-[960px] mx-auto px-6 py-16 md:py-20 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-4">Our Story</p>
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-charcoal">Why This Directory Exists</h1>
          <div className="w-20 h-1 bg-gold rounded-full mx-auto mt-6" />
        </div>
      </section>

      <section className="max-w-[820px] mx-auto px-6 py-12">
        <p className="font-serif text-2xl md:text-3xl italic leading-relaxed text-charcoal mb-8">
          &ldquo;When my grandfather was diagnosed with Alzheimer&apos;s, our family had to make high-stakes decisions fast.&rdquo;
        </p>
        <div className="space-y-6 text-lg leading-relaxed text-charcoal/80">
          <p>
            We needed clear, trustworthy information, but much of what we found felt incomplete, sales-driven, or hard to verify.
          </p>
          <p>
            SilverTech was built to fix that: a commission-free directory focused on transparent data, direct community contact, and practical tools families can trust.
          </p>
        </div>
      </section>

      <section className="border-y border-warm-gray bg-white">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <h2 className="text-3xl font-serif font-bold text-charcoal text-center mb-4">The Cost of Commissions</h2>
          <p className="max-w-3xl mx-auto text-center text-charcoal/70 mb-10">
            Many placement models are built around referral fees. We chose a different path so families can evaluate options without financial steering.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <article className="rounded-xl border border-red-100 bg-red-50/40 p-6">
              <h3 className="text-xl font-semibold text-charcoal mb-4">The Industry Impact</h3>
              <div className="space-y-4 text-charcoal/75">
                <p>
                  High referral fees can make it harder for smaller communities to participate, which can reduce the range of options families see.
                </p>
                <p>
                  When economics drive visibility, the search experience can feel more like sales than decision support.
                </p>
              </div>
            </article>

            <article className="rounded-xl border border-gold/40 bg-warm-gray p-6">
              <h3 className="text-xl font-semibold text-charcoal mb-4">The SilverTech Difference</h3>
              <div className="space-y-4 text-charcoal/75">
                <p>
                  Our model is commission-free. That removes incentive to route families toward specific communities.
                </p>
                <p>
                  We prioritize transparent data and direct connection so families can make an informed choice with confidence.
                </p>
              </div>
            </article>
          </div>

          <div className="max-w-3xl mx-auto mt-8 rounded-xl border-2 border-gold/50 bg-gold/5 px-5 py-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-gold mt-0.5 flex-shrink-0" />
            <p className="text-charcoal/80 text-sm">
              Ask every directory or advisor a simple question: &ldquo;How are you paid for recommendations?&rdquo; Transparency matters.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-warm-white">
        <div className="max-w-[1100px] mx-auto px-6 py-16">
          <h2 className="text-3xl font-serif font-bold text-charcoal text-center mb-3">Our Data Promise</h2>
          <p className="text-center text-charcoal/70 max-w-2xl mx-auto mb-10">
            Integrity is the foundation of every search.
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: ShieldCheck,
                title: 'Public Record Audits',
                body: 'Licensing and regulatory records are incorporated from public sources.',
              },
              {
                icon: BadgeCheck,
                title: 'No Commission Bias',
                body: 'We do not accept referral commissions for placements.',
              },
              {
                icon: CheckCircle2,
                title: 'Direct Verification',
                body: 'Operators can claim and update profiles to improve listing accuracy.',
              },
              {
                icon: Building2,
                title: 'Source Transparency',
                body: 'Where possible, we link out to original state and federal resources.',
              },
            ].map((item) => (
              <article key={item.title} className="rounded-xl border border-warm-gray bg-white p-6">
                <item.icon className="w-6 h-6 text-gold mb-4" />
                <h3 className="font-semibold text-charcoal mb-2">{item.title}</h3>
                <p className="text-sm text-charcoal/70">{item.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-[900px] mx-auto px-6 py-16">
        <div className="rounded-2xl bg-charcoal border border-gold/40 px-8 py-10 text-center">
          <h2 className="text-3xl font-serif font-bold text-white mb-3">Ready to Search with Confidence?</h2>
          <p className="text-white/80 mb-8">Explore verified listings and connect directly with communities.</p>
          <div className="flex justify-center gap-3 flex-wrap">
            <Link
              to="/search"
              className="inline-flex items-center justify-center min-h-11 px-8 py-3 rounded-lg bg-gold text-charcoal font-bold hover:opacity-90 transition-opacity"
            >
              Start Your Search
            </Link>
            <Link
              to="/for-facilities"
              className="inline-flex items-center justify-center min-h-11 px-6 py-3 rounded-lg border border-white/40 text-white font-medium hover:bg-white/10 transition-colors"
            >
              For Facilities
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default WhyThisExistsPage;
