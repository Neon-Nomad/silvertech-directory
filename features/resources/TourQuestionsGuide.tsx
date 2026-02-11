import React from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';

export const TourQuestionsGuide: React.FC = () => {
  return (
    <div className="min-h-screen bg-warm-white text-charcoal">
      <Helmet>
        <title>Questions to Ask on a Senior Living Tour | SilverTech</title>
        <meta
          name="description"
          content="A practical checklist of questions to ask during a senior living tour, focused on safety, staffing, and daily life."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/guides/tour-questions" />
      </Helmet>

      <main className="max-w-[920px] mx-auto px-6 py-16">
        <nav className="text-xs text-slate-400 uppercase tracking-widest mb-6">
          <Link to="/" className="hover:text-gold">Home</Link> <span className="mx-2">/</span>
          <Link to="/resources/guides" className="hover:text-gold">Resources</Link> <span className="mx-2">/</span>
          <span className="text-slate-500">Tour Questions</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-serif font-bold mb-4">
          Tour Questions to Ask Before Choosing a Community
        </h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-10">
          Use this checklist during tours to identify real quality signals and avoid sales-first answers.
        </p>

        <section className="space-y-8">
          <div>
            <h2 className="text-xl font-bold mb-2">Safety & staffing</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>What is the staff-to-resident ratio by shift?</li>
              <li>How are emergencies handled overnight?</li>
              <li>How long have the current managers been in place?</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Care and health support</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>How are care levels assessed and updated?</li>
              <li>What happens if care needs increase?</li>
              <li>Are nurses on-site or on-call?</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Daily life and culture</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>What does a typical weekday look like?</li>
              <li>Can we see the dining schedule and sample menus?</li>
              <li>How are family updates communicated?</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Costs and terms</h2>
            <ul className="list-disc pl-5 text-slate-600 space-y-2">
              <li>What is included in the base rate?</li>
              <li>What services are billed separately?</li>
              <li>What is the move-out notice policy?</li>
            </ul>
          </div>
        </section>

        <div className="mt-12 p-6 bg-warm-gray border border-slate-200 rounded-xl">
          <h3 className="font-bold text-lg mb-2">Search more resources</h3>
          <p className="text-slate-600 mb-4">
            Jump straight to official regulations, licensing, and state resources.
          </p>
          <Link
            to="/regulatory-library"
            className="inline-flex items-center gap-2 px-4 py-2 border-2 border-charcoal text-charcoal font-bold rounded-lg hover:bg-charcoal hover:text-white transition-all"
          >
            Go to Regulatory Library
          </Link>
        </div>
      </main>
    </div>
  );
};
