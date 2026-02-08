import React from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ArrowLeft, Loader, Flag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ALL_STATES } from '../../../src/data/states';
import { Breadcrumbs } from '../../../components/ui/Breadcrumbs';
import { useRegulatoryContent } from '../../../src/hooks/useRegulatoryContent';

export const StateVeteransPage: React.FC = () => {
    const { state } = useParams<{ state: string }>();
    const stateDef = ALL_STATES.find(s => s.slug === state);
    const { data: regulatoryData, loading, error } = useRegulatoryContent(state || '');

    if (!stateDef) {
        return <Navigate to="/" replace />;
    }

    const pageTitle = `${stateDef.name} Veterans Benefits for Senior Care | SilverTech`;
    const pageDescription = `Learn about veterans benefits for senior care in ${stateDef.name}. Find aid and attendance information, state veterans homes, and support resources.`;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            <Helmet>
                <title>{pageTitle}</title>
                <meta name="description" content={pageDescription} />
                <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/veterans`} />
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="SilverTech Directory" />
                <meta property="og:title" content={pageTitle} />
                <meta property="og:description" content={pageDescription} />
                <meta property="og:url" content={`https://silvertechdirectory.com/states/${stateDef.slug}/veterans`} />
                <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={pageTitle} />
                <meta name="twitter:description" content={pageDescription} />
                <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
            </Helmet>

            {/* Header */}
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <Breadcrumbs
                        items={[
                            { label: 'Home', path: '/' },
                            { label: 'States', path: '/states' },
                            { label: stateDef.name, path: `/states/${stateDef.slug}` },
                            { label: 'Veterans Benefits', path: `/states/${stateDef.slug}/veterans` },
                        ]}
                    />

                    <div className="mt-6 flex items-center gap-4">
                        <Link
                            to={`/states/${stateDef.slug}`}
                            className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-600" />
                        </Link>
                        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 flex items-center gap-3">
                            <Flag className="w-8 h-8 text-blue-600" />
                            Veterans Benefits in {stateDef.name}
                        </h1>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 prose prose-slate max-w-none">
                            {loading ? (
                                <div className="flex items-center justify-center py-12">
                                    <Loader className="w-8 h-8 text-blue-600 animate-spin" />
                                </div>
                            ) : error ? (
                                <div className="text-red-600 p-4 bg-red-50 rounded-lg">
                                    Failed to load content. Please try again later.
                                </div>
                            ) : regulatoryData?.veterans_content ? (
                                <ReactMarkdown>{regulatoryData.veterans_content}</ReactMarkdown>
                            ) : (
                                <div>
                                    <h2>Veterans Benefits for Senior Care</h2>
                                    <p>
                                        Veterans and their spouses may be eligible for benefits to help pay for assisted living and other long-term care in {stateDef.name}.
                                        The most common benefit is the Aid and Attendance pension, which provides monthly payments to wartime veterans and survivors who need help with daily activities.
                                    </p>
                                    <h3>Key Resources</h3>
                                    <ul>
                                        <li><strong>Aid and Attendance:</strong> A tax-free benefit for veterans who need the aid of another person.</li>
                                        <li><strong>State Veterans Homes:</strong> {stateDef.name} may operate veterans homes that provide skilled nursing and assisted living care.</li>
                                        <li><strong>VA Health Care:</strong> Enrolled veterans can access medical care and geriatric services.</li>
                                    </ul>
                                    <p>
                                        We are currently gathering detailed veterans benefit information for {stateDef.name}.
                                        Please contact your local Veterans Service Officer (VSO) for personalized assistance.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-6 rounded-xl border border-blue-100">
                            <h3 className="text-lg font-bold text-blue-900 mb-4">Need Help?</h3>
                            <p className="text-blue-800 mb-4">
                                Navigating veterans benefits can be complex. A local Veterans Service Officer (VSO) can help you file claims for free.
                            </p>
                            {regulatoryData?.contacts_json?.veterans ? (
                                <div className="space-y-3">
                                    {regulatoryData.contacts_json.veterans.phone && (
                                        <div className="flex items-center gap-2 text-blue-900">
                                            <span className="font-semibold">Phone:</span>
                                            <a href={`tel:${regulatoryData.contacts_json.veterans.phone}`} className="hover:underline">
                                                {regulatoryData.contacts_json.veterans.phone}
                                            </a>
                                        </div>
                                    )}
                                    {regulatoryData.contacts_json.veterans.website && (
                                        <a
                                            href={regulatoryData.contacts_json.veterans.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                                        >
                                            Visit Official Website
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <a
                                    href="https://www.va.gov/find-locations/"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="block w-full py-2 px-4 bg-blue-600 text-white text-center rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Find a VSO Near You
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
