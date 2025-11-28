import React from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_STATES } from '../../../src/data/states';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { getMedicaidWaiver } from '../../../src/utils/medicaidData';
import { MedicaidWaiverCard } from '../../family/finance/MedicaidWaiverCard';
import { ArrowLeft, DollarSign, FileText } from 'lucide-react';

export const StateMedicaidPage: React.FC = () => {
  const { state } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find(s => s.slug === state);

  if (!stateDef) {
    return <Navigate to="/" replace />;
  }

  const waiver = getMedicaidWaiver(stateDef.abbreviation);
  const pageTitle = `${stateDef.name} Medicaid for Assisted Living | Income Limits & Waivers`;
  const pageDescription = `Learn about Medicaid coverage for assisted living in ${stateDef.name}. Find income limits, asset requirements, and details on the ${waiver?.program_name || 'HCBS Waiver'}.`;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/medicaid`} />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Breadcrumbs 
            items={[
              { label: 'Home', path: '/' },
              { label: 'States', path: '/states' },
              { label: stateDef.name, path: `/states/${stateDef.slug}` },
              { label: 'Medicaid & Financial Aid', path: `/states/${stateDef.slug}/medicaid` },
            ]} 
          />
          
          <div className="mt-6">
            <Link to={`/states/${stateDef.slug}`} className="inline-flex items-center text-sm text-slate-500 hover:text-primary-600 mb-4">
               <ArrowLeft className="w-4 h-4 mr-1" /> Back to {stateDef.name} Overview
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
              Medicaid & Financial Aid in {stateDef.name}
            </h1>
            <p className="text-xl text-slate-600 max-w-3xl">
              Understanding how to pay for care is one of the biggest challenges for families. 
              This guide explains exactly what {stateDef.name} Medicaid covers, who is eligible, and how to apply.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
                
                {/* The Big Question */}
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
                    <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <DollarSign className="w-6 h-6 text-green-600" />
                        Does Medicaid Pay for Assisted Living in {stateDef.name}?
                    </h2>
                    <div className="prose prose-slate max-w-none text-slate-600">
                        <p>
                            The short answer is: <strong>Yes, but with conditions.</strong>
                        </p>
                        <p>
                            In {stateDef.name}, Medicaid typically pays for the <em>care services</em> provided in an assisted living facility (like help with bathing, dressing, and medication management), but it <strong>does not</strong> pay for the cost of "Room and Board" (rent and food).
                        </p>
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 not-prose mt-4">
                            <h4 className="font-semibold text-blue-900 mb-2">The "Room & Board" Gap</h4>
                            <p className="text-sm text-blue-800">
                                You will usually need to use your Social Security income (SSI) or other personal funds to pay for the room and board portion of the monthly fee. The Medicaid waiver then picks up the bill for the care services.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Waiver Card */}
                {waiver ? (
                    <div>
                        <h2 className="text-2xl font-bold text-slate-900 mb-6">Current Waiver Program</h2>
                        <MedicaidWaiverCard waiver={waiver} />
                    </div>
                ) : (
                    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 text-yellow-800">
                        We are currently updating our database with the latest {stateDef.name} waiver information. Please check back soon or contact your local Area Agency on Aging.
                    </div>
                )}

            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-900 mb-4">Quick Resources</h3>
                    <ul className="space-y-3">
                        <li>
                            <Link to={`/states/${stateDef.slug}/ombudsman`} className="flex items-center gap-2 text-primary-600 hover:underline">
                                <FileText className="w-4 h-4" />
                                How to Apply (Ombudsman Help)
                            </Link>
                        </li>
                        <li>
                            <a href="https://www.medicaid.gov" target="_blank" rel="noreferrer" className="flex items-center gap-2 text-primary-600 hover:underline">
                                <FileText className="w-4 h-4" />
                                Official Medicaid Website
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
