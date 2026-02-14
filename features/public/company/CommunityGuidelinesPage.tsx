import React from 'react';
import { Helmet } from 'react-helmet-async';

export const CommunityGuidelinesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Helmet>
        <title>Q&A Community Guidelines | SilverTech Directory</title>
        <meta
          name="description"
          content="Read SilverTech Directory's Q&A community guidelines, moderation standards, and verified representative policy."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/community-guidelines" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Q&A Community Guidelines</h1>
          <p className="text-lg text-slate-600">
            This Q&A section exists to help families evaluate communities with clear, respectful, and factual answers.
          </p>
        </div>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">What belongs here</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-2">
            <li>Questions about staffing, amenities, tours, contracts, and daily life at a facility.</li>
            <li>Operational questions that help families compare options.</li>
            <li>Clarifying questions on public licensing and oversight information.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">What does not belong here</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-2">
            <li>No medical advice requests or treatment recommendations.</li>
            <li>No private resident information, diagnoses, or personal health details.</li>
            <li>No harassment, abuse, threats, or spam.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Verified Representative policy</h2>
          <p className="text-slate-600">
            The "Verified Representative" badge is applied to responses posted by authenticated accounts that own or manage
            the facility listing in SilverTech Directory.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Moderation and reporting</h2>
          <p className="text-slate-600">
            All submissions can be reviewed. Users can report content for misinformation, privacy concerns, abuse, off-topic
            posts, or spam. Reported content may be removed or rejected to protect families and residents.
          </p>
        </section>
      </div>
    </div>
  );
};

