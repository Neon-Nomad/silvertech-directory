import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_STATES } from '../../../src/data/states';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { Building2, Scale, HeartHandshake, ShieldCheck, MapPin, ArrowRight, Flag } from 'lucide-react';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';

export const StateHubHome: React.FC = () => {
  const { state } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find(s => s.slug === state);

  if (!stateDef) {
    return <Navigate to="/" replace />;
  }

  const pageTitle = `How to Pay for Senior Care in ${stateDef.name} | Assisted Living & Medicaid`;
  const pageDescription = `The definitive guide to senior living in ${stateDef.name}. Explore assisted living options, Medicaid financial aid, state regulations, and consumer protection resources.`;

  const hubLinks = [
    {
      title: 'Assisted Living Directory',
      description: `Browse all licensed facilities in ${stateDef.name}.`,
      icon: Building2,
      path: `/states/${stateDef.slug}/assisted-living`,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      title: 'Medicaid & Financial Aid',
      description: 'Income limits, waivers, and how to pay for care.',
      icon: HeartHandshake,
      path: `/states/${stateDef.slug}/medicaid`,
      color: 'bg-green-50 text-green-600'
    },
    {
      title: 'Rules & Regulations',
      description: 'Licensing standards and resident rights.',
      icon: Scale,
      path: `/states/${stateDef.slug}/rules`,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      title: 'Ombudsman & Complaints',
      description: 'How to file complaints and get advocacy.',
      icon: ShieldCheck,
      path: `/states/${stateDef.slug}/ombudsman`,
      color: 'bg-orange-50 text-orange-600'
    },
    {
      title: 'Veterans Benefits',
      description: 'Aid & Attendance and state veterans homes.',
      icon: Flag, // You'll need to import Flag from lucide-react
      path: `/states/${stateDef.slug}/veterans`,
      color: 'bg-indigo-50 text-indigo-600'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://silvertechdirectory.com/states/${stateDef.slug}`} />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'States', path: '/states' }, // Placeholder for a future "All States" page
              { label: stateDef.name, path: `/states/${stateDef.slug}` },
            ]}
          />

          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mt-6 mb-4">
            {stateDef.name} Senior Care Authority
          </h1>

          <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
            Your complete guide to navigating senior living in {stateDef.name}.
            We provide transparent data on costs, financial aid, and facility quality to help you make informed decisions.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ContentMeta />
        <div className="mt-3">
          <DataSourceNote note="State hub information is compiled from public records and official state agencies." />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* Hub Navigation Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {hubLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group flex items-start gap-6"
            >
              <div className={`p-4 rounded-lg ${link.color} group-hover:scale-110 transition-transform`}>
                <link.icon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-slate-900 mb-2 group-hover:text-primary-700 flex items-center gap-2">
                  {link.title}
                  <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </h2>
                <p className="text-slate-600">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Stats / Overview */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-12">
          <h2 className="text-2xl font-bold mb-6">Senior Living in {stateDef.name} at a Glance</h2>
          <div className="grid sm:grid-cols-3 gap-8">
            <div className="text-center">
              <span className="block text-4xl font-bold text-slate-900 mb-2">2,900+</span>
              <span className="text-slate-600 font-medium">Licensed Facilities</span>
            </div>
            <div className="text-center border-l border-slate-100">
              <span className="block text-4xl font-bold text-slate-900 mb-2">$4,500</span>
              <span className="text-slate-600 font-medium">Avg. Monthly Cost</span>
            </div>
            <div className="text-center border-l border-slate-100">
              <span className="block text-4xl font-bold text-slate-900 mb-2">Top 5</span>
              <span className="text-slate-600 font-medium">Retirement Destination</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
