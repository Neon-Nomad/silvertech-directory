import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import ReactMarkdown from 'react-markdown';
import { ALL_STATES } from '../../../src/data/states';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { getOmbudsman } from '../../../src/utils/ombudsmanData';
import { getAgingAgency } from '../../../src/utils/agingAgencyData';
import { OmbudsmanCard } from '../../family/support/OmbudsmanCard';
import { AgingAgencyCard } from '../../family/support/AgingAgencyCard';
import { ArrowLeft, ShieldCheck, Phone, Loader, FileText } from 'lucide-react';
import { useRegulatoryContent } from '@/src/hooks/useRegulatoryContent';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';

export const StateOmbudsmanPage: React.FC = () => {
  const { state } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find(s => s.slug === state);
  const { data: regulatoryData, loading } = useRegulatoryContent(state);

  if (!stateDef) {
    return <Navigate to="/" replace />;
  }

  const ombudsman = getOmbudsman(stateDef.abbreviation);
  const aaa = getAgingAgency(stateDef.abbreviation);

  const pageTitle = `${stateDef.name} Long-Term Care Ombudsman | File a Complaint`;
  const pageDescription = `Contact the ${stateDef.name} Long-Term Care Ombudsman to resolve complaints about assisted living. Find local advocates and Area Agencies on Aging near you.`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/ombudsman`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://silvertechdirectory.com/states/${stateDef.slug}/ombudsman`} />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'States', path: '/states' },
              { label: stateDef.name, path: `/states/${stateDef.slug}` },
              { label: 'Ombudsman & Complaints', path: `/states/${stateDef.slug}/ombudsman` },
            ]}
          />

          <div className="mt-6">
            <Link to={`/states/${stateDef.slug}`} className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-4">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to {stateDef.name} Overview
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Ombudsman & Consumer Protection in {stateDef.name}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl">
              You are not alone. The Long-Term Care Ombudsman Program provides free, confidential advocacy for residents of assisted living facilities.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ContentMeta />
        <div className="mt-3">
          <DataSourceNote note="Ombudsman and agency contacts are compiled from official state directories and public agency listings." />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Ombudsman Card */}
            {ombudsman && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Your State Ombudsman</h2>
                <OmbudsmanCard program={ombudsman} variant="full" />
              </div>
            )}

            {/* Dynamic Content from Supabase */}
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : regulatoryData?.ombudsman_content ? (
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 prose prose-slate max-w-none">
                <ReactMarkdown>{regulatoryData.ombudsman_content}</ReactMarkdown>
              </div>
            ) : (
              /* Fallback Static Content */
              <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-orange-600" />
                  What Can an Ombudsman Do?
                </h2>
                <p className="text-slate-600 mb-4">
                  Ombudsmen are state-certified advocates who resolve problems related to the health, safety, welfare, and rights of individuals who live in long-term care facilities.
                </p>
                <ul className="space-y-3">
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700"><strong>Investigate Complaints:</strong> They look into issues like poor care, food quality, or staffing shortages.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700"><strong>Protect Rights:</strong> They ensure residents are treated with dignity and not subject to eviction without cause.</span>
                  </li>
                  <li className="flex gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700"><strong>Confidentiality:</strong> They will not share your name or complaint with the facility without your permission.</span>
                  </li>
                </ul>
              </div>
            )}

            {/* AAA Card */}
            {aaa && (
              <div>
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Local Area Agencies on Aging</h2>
                <AgingAgencyCard agency={aaa} variant="full" />
              </div>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <div className="bg-primary-50 p-6 rounded-xl border border-primary-100">
              <h3 className="font-bold text-primary-900 mb-2">In an Emergency</h3>
              <p className="text-sm text-primary-800 mb-4">
                If you suspect immediate physical danger or a life-threatening situation, do not wait for an ombudsman.
              </p>
              <div className="flex items-center gap-2 font-bold text-primary-900 text-lg">
                <Phone className="w-5 h-5" />
                Call 911
              </div>
            </div>

            {regulatoryData?.contacts_json?.ombudsman && (
              <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                <h3 className="font-bold text-orange-900 mb-2">Ombudsman Contact</h3>
                <p className="font-medium text-orange-900">{regulatoryData.contacts_json.ombudsman.name}</p>
                {regulatoryData.contacts_json.ombudsman.phone && (
                  <p className="text-orange-800 mt-2">Phone: {regulatoryData.contacts_json.ombudsman.phone}</p>
                )}
                {regulatoryData.contacts_json.ombudsman.website && (
                  <a href={regulatoryData.contacts_json.ombudsman.website} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-orange-700 hover:underline mt-3 text-sm">
                    <FileText className="w-4 h-4" />
                    Official Website
                  </a>
                )}
              </div>
            )}

            {regulatoryData?.contacts_json?.elderAbuse && (
              <div className="bg-red-50 p-6 rounded-xl border border-red-100">
                <h3 className="font-bold text-red-900 mb-2">Report Elder Abuse</h3>
                <p className="font-medium text-red-900">{regulatoryData.contacts_json.elderAbuse.name}</p>
                {regulatoryData.contacts_json.elderAbuse.phone && (
                  <p className="text-red-800 mt-2">Hotline: {regulatoryData.contacts_json.elderAbuse.phone}</p>
                )}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
