import React from 'react';
import { Helmet } from 'react-helmet-async';
import { ContentMeta } from '@/components/ui/ContentMeta';

export const EditorialPolicyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Helmet>
        <title>Editorial Policy | SilverTech Directory</title>
        <meta name="description" content="Learn how SilverTech Directory creates, reviews, and updates senior care content with transparency and sourcing standards." />
        <link rel="canonical" href="https://silvertechdirectory.com/editorial-policy" />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="Editorial Policy | SilverTech Directory" />
        <meta property="og:description" content="Learn how SilverTech Directory creates, reviews, and updates senior care content with transparency and sourcing standards." />
        <meta property="og:url" content="https://silvertechdirectory.com/editorial-policy" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Editorial Policy | SilverTech Directory" />
        <meta name="twitter:description" content="Learn how SilverTech Directory creates, reviews, and updates senior care content with transparency and sourcing standards." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Editorial Policy</h1>
          <p className="text-lg text-slate-600">
            Our mission is to provide transparent, commission-free information that helps families make confident decisions about senior care.
            This policy explains how we create, update, and source our content.
          </p>
        </div>

        <ContentMeta />

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Our Standards</h2>
          <ul className="list-disc pl-5 text-slate-600 space-y-2">
            <li>We prioritize official sources such as state licensing agencies and public regulatory databases.</li>
            <li>We disclose financial incentives and do not allow payment to influence rankings.</li>
            <li>We update content when regulations or source data change.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">How We Source Data</h2>
          <p className="text-slate-600">
            Facility listings and regulatory guides are compiled from public records and official state resources.
            Where available, we link to the original authority sources so families can verify directly.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Corrections</h2>
          <p className="text-slate-600">
            If you see a mistake or outdated information, please contact us and we will investigate and update promptly.
            We do not charge for corrections.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-2xl font-bold text-slate-900">Contact</h2>
          <p className="text-slate-600">
            Email us at <a className="text-primary-600 hover:underline" href="mailto:andrew@silvertechdirectory.com">andrew@silvertechdirectory.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
};
