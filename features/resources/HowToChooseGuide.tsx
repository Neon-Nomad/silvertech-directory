import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const HowToChooseGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-white text-charcoal">
      <Helmet>
        <title>How to Choose a Senior Living Community | SilverTech</title>
        <meta
          name="description"
          content="A step-by-step framework for evaluating care levels, community culture, safety, and fit when choosing senior living."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/guides/how-to-choose" />
      </Helmet>

      <main className="max-w-[920px] mx-auto px-6 py-16">
        <nav className="text-xs text-slate-400 uppercase tracking-widest mb-6">
          <Link to="/" className="hover:text-gold">Home</Link> <span className="mx-2">/</span>
          <Link to="/resources/guides" className="hover:text-gold">Resources</Link> <span className="mx-2">/</span>
          <span className="text-slate-500">How to Choose</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
          How to Choose a Senior Living Community
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          Use this framework to filter noise, compare communities fairly, and focus on what actually
          impacts safety, quality of life, and long-term fit.
        </p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-2">1) Start with care level, not amenities</h2>
            <p className="text-slate-600 leading-relaxed">
              Identify the current care level (assisted living, memory care, skilled nursing) and the
              likely next stage. The best community is one that can support needs now and reduce
              disruptive moves later.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">2) Safety and oversight first</h2>
            <p className="text-slate-600 leading-relaxed">
              Review licensing status, inspection history, and complaint patterns. A beautiful
              lobby is not a safety signal. Regulatory data is.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">3) Staffing and response time</h2>
            <p className="text-slate-600 leading-relaxed">
              Ask about staffing ratios, overnight coverage, and turnover. These are leading
              indicators of resident experience and outcomes.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">4) Daily life fit</h2>
            <p className="text-slate-600 leading-relaxed">
              Meals, activities, transportation, and resident culture matter once safety and care
              level are confirmed. Visit at least once during a normal weekday, not a special event.
            </p>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">5) Compare before you commit</h2>
            <p className="text-slate-600 leading-relaxed">
              Compare three options side-by-side: safety, staffing, care offerings, and distance.
              This keeps decisions grounded in data, not pressure.
            </p>
          </div>
        </section>

        <div className="mt-12 p-6 bg-warm-gray border border-slate-200 rounded-xl">
          <h3 className="font-bold text-lg mb-2">Ready to explore resources?</h3>
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
