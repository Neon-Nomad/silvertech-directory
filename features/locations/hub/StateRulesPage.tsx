import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_STATES } from '../../../src/data/states';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { getLicensingAuthority } from '../../../src/utils/licensingData';
import { LicensingAuthorityCard } from '../../family/support/LicensingAuthorityCard';
import { ArrowLeft, Scale, AlertTriangle, CheckCircle } from 'lucide-react';

export const StateRulesPage: React.FC = () => {
  const { state } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find(s => s.slug === state);

  if (!stateDef) {
    return <Navigate to="/" replace />;
  }

  const authority = getLicensingAuthority(stateDef.abbreviation);
  const pageTitle = `${stateDef.name} Assisted Living Regulations | Licensing & Rules`;
  const pageDescription = `Understand the rules and regulations for assisted living facilities in ${stateDef.name}. Learn about resident rights, staffing requirements, and how to check a facility's license.`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/rules`} />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs 
            items={[
              { label: 'Home', path: '/' },
              { label: 'States', path: '/states' },
              { label: stateDef.name, path: `/states/${stateDef.slug}` },
              { label: 'Rules & Regulations', path: `/states/${stateDef.slug}/rules` },
            ]} 
          />
          
          <div className="mt-6">
            <Link to={`/states/${stateDef.slug}`} className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-4">
               <ArrowLeft className="w-4 h-4 mr-1" /> Back to {stateDef.name} Overview
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Licensing & Regulations in {stateDef.name}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl">
              Every assisted living facility in {stateDef.name} must follow strict state laws designed to protect residents. 
              Knowing these rules empowers you to advocate for better care.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* Licensing Authority Card */}
                {authority && (
                    <div className="mb-8">
                        <h2 className="text-2xl font-bold text-slate-900 mb-4">Who Regulates Facilities?</h2>
                        <LicensingAuthorityCard authority={authority} variant="full" />
                    </div>
                )}

                {/* Common Regulations */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                        <Scale className="w-6 h-6 text-purple-600" />
                        Key Resident Rights
                    </h2>
                    <div className="space-y-6">
                        <div className="flex gap-4">
                            <div className="bg-green-100 p-2 rounded-full h-fit">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Right to Dignity & Respect</h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    Residents must be treated with consideration, respect, and full recognition of their dignity and individuality.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-green-100 p-2 rounded-full h-fit">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Freedom from Abuse</h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    Strict prohibition of verbal, sexual, physical, and mental abuse, corporal punishment, and involuntary seclusion.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <div className="bg-green-100 p-2 rounded-full h-fit">
                                <CheckCircle className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900">Right to Visitors</h3>
                                <p className="text-slate-600 text-sm mt-1">
                                    Residents have the right to receive visitors, including family, friends, and ombudsmen, at reasonable hours.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Warning Signs */}
                <div className="bg-red-50 p-8 rounded-xl border border-red-100">
                    <h2 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5" />
                        Red Flags: When to Report
                    </h2>
                    <ul className="list-disc list-inside text-red-800 space-y-2">
                        <li>Unexplained bruises or injuries.</li>
                        <li>Sudden weight loss or signs of dehydration.</li>
                        <li>Poor hygiene or dirty living conditions.</li>
                        <li>Staff refusing to let you see the resident alone.</li>
                        <li>Missing personal items or funds.</li>
                    </ul>
                    <div className="mt-6">
                        <Link to={`/states/${stateDef.slug}/ombudsman`} className="bg-red-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors inline-block">
                            Report a Problem
                        </Link>
                    </div>
                </div>

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">Verify a License</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Always check if a facility has a valid license and view their inspection history before moving in.
                    </p>
                    {authority?.verify_license_url ? (
                        <a 
                            href={authority.verify_license_url} 
                            target="_blank" 
                            rel="noreferrer"
                            className="block w-full text-center bg-slate-100 hover:bg-slate-200 text-slate-900 font-medium py-3 rounded-lg transition-colors"
                        >
                            Search State Database
                        </a>
                    ) : (
                        <div className="text-sm text-slate-500 italic">Link unavailable</div>
                    )}
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
