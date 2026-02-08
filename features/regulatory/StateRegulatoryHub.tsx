import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_STATES } from '@/src/data/states';
import { ChevronRight, ShieldCheck, FileText, Users, Building2, AlertCircle, Phone, ExternalLink } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import ReactMarkdown from 'react-markdown';

// Define the shape of our regulatory data
interface RegulatoryData {
    state_slug: string;
    medicaid_content: string;
    licensing_content: string;
    ombudsman_content: string;
    complaints_content: string;
    veterans_content: string;
    contacts_json: {
        licensing?: { name: string; phone?: string; website?: string; };
        ombudsman?: { name: string; phone?: string; website?: string; };
        medicaid?: { name: string; phone?: string; website?: string; };
        elderAbuse?: { name: string; phone?: string; };
        veterans?: { name: string; phone?: string; website?: string; };
    };
}

export const StateRegulatoryHub: React.FC = () => {
    const { state: stateSlug } = useParams<{ state: string }>();
    const stateDef = ALL_STATES.find(s => s.slug === stateSlug);

    const [data, setData] = useState<RegulatoryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            if (!stateSlug) return;

            // 1. Try to load static JSON (Fastest)
            try {
                // Use import.meta.glob for Vite compatibility
                const regulations = import.meta.glob('../../src/generated/regulations/*.json');

                // Convert kebab-case slug (new-jersey) to snake_case (new_jersey) for file matching
                const fileSlug = stateSlug.replace(/-/g, '_');
                const loadRegulation = regulations[`../../src/generated/regulations/${fileSlug}.json`];

                if (loadRegulation) {
                    const staticData: any = await loadRegulation();
                    if (staticData) {
                        setData(staticData.default || staticData);
                        setLoading(false); // Show content immediately
                    }
                } else {
                    console.warn(`Static data not found for ${stateSlug} (file: ${fileSlug}.json)`);
                }
            } catch (e) {
                console.warn(`Error loading static data for ${stateSlug}`, e);
            }

            // 2. Fetch from Supabase (Live Truth)
            try {
                const { data: liveData, error } = await supabase
                    .from('regulatory_content')
                    .select('*')
                    .eq('state_slug', stateSlug)
                    .single();

                if (liveData && !error) {
                    // Override static data with live data
                    setData(liveData);
                }
            } catch (e) {
                console.error('Error fetching live data', e);
            } finally {
                setLoading(false);
            }
        }

        loadData();
    }, [stateSlug]);

    if (!stateDef) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center">
                    <h1 className="text-2xl font-light text-slate-900 mb-4">State Not Found</h1>
                    <Link to="/regulatory-library" className="text-primary-600 hover:underline">
                        Return to Regulatory Library
                    </Link>
                </div>
            </div>
        );
    }

    if (loading && !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-4 w-32 bg-slate-200 rounded mb-4"></div>
                    <div className="h-2 w-48 bg-slate-100 rounded"></div>
                </div>
            </div>
        );
    }

    // Fallback if no data found at all
    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="text-center max-w-md px-4">
                    <h1 className="text-2xl font-light text-slate-900 mb-4">{stateDef.name} Regulatory Guide</h1>
                    <p className="text-slate-600 mb-6">
                        We are currently compiling the regulatory data for {stateDef.name}.
                        Please check back soon or visit the national library.
                    </p>
                    <Link to="/regulatory-library" className="text-primary-600 hover:underline">
                        Return to Regulatory Library
                    </Link>
                </div>
            </div>
        );
    }

    const sections = [
        { id: 'medicaid', title: 'Medicaid Programs', icon: ShieldCheck },
        { id: 'licensing', title: 'Licensing Authority', icon: Building2 },
        { id: 'ombudsman', title: 'Ombudsman & Advocacy', icon: Users },
        { id: 'complaints', title: 'Complaint Process', icon: AlertCircle },
        { id: 'veterans', title: 'Veterans Benefits', icon: FileText },
        { id: 'contacts', title: 'Verified Authority Contacts', icon: Phone },
    ];

    return (
        <>
            <Helmet>
                <title>{`How to Pay for Memory Care & Assisted Living in ${stateDef.name} | Regulations`}</title>
                <meta
                    name="description"
                    content={`Complete guide to ${stateDef.name} senior living regulations, Medicaid waivers, licensing requirements, and how to pay for memory care and assisted living.`}
                />
                <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/regulatory`} />
                <meta property="og:type" content="article" />
                <meta property="og:site_name" content="SilverTech Directory" />
                <meta property="og:title" content={`How to Pay for Memory Care & Assisted Living in ${stateDef.name} | Regulations`} />
                <meta property="og:description" content={`Complete guide to ${stateDef.name} senior living regulations, Medicaid waivers, licensing requirements, and how to pay for memory care and assisted living.`} />
                <meta property="og:url" content={`https://silvertechdirectory.com/states/${stateDef.slug}/regulatory`} />
                <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
                <meta name="twitter:card" content="summary_large_image" />
                <meta name="twitter:title" content={`How to Pay for Memory Care & Assisted Living in ${stateDef.name} | Regulations`} />
                <meta name="twitter:description" content={`Complete guide to ${stateDef.name} senior living regulations, Medicaid waivers, licensing requirements, and how to pay for memory care and assisted living.`} />
                <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
            </Helmet>

            <div className="bg-white min-h-screen">
                {/* Breadcrumbs */}
                <div className="border-b border-slate-100 bg-slate-50">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center text-sm text-slate-500">
                            <Link to="/regulatory-library" className="hover:text-slate-900 transition-colors">
                                Regulatory Library
                            </Link>
                            <ChevronRight size={16} className="mx-2" />
                            <span className="text-slate-900 font-medium">{stateDef.name}</span>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                    <div className="flex flex-col lg:flex-row gap-12">

                        {/* Sidebar Navigation */}
                        <div className="lg:w-64 flex-shrink-0 hidden lg:block">
                            <div className="">
                                <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                                    Contents
                                </h3>
                                <nav className="space-y-1">
                                    {sections.map((section) => (
                                        <a
                                            key={section.id}
                                            href={`#${section.id}`}
                                            className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
                                        >
                                            <section.icon size={16} className="text-slate-400" />
                                            {section.title}
                                        </a>
                                    ))}
                                </nav>
                            </div>
                        </div>

                        {/* Main Content */}
                        <div className="flex-1 min-w-0">
                            <header className="mb-12 border-b border-slate-100 pb-8">
                                <div className="flex items-center gap-2 text-primary-600 mb-4">
                                    <ShieldCheck size={20} />
                                    <span className="text-sm font-medium uppercase tracking-wide">Verified Authority</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-light text-slate-900 mb-6 leading-tight">
                                    {stateDef.name} Senior Living Regulation & Resources
                                </h1>
                                <p className="text-xl text-slate-600 font-light leading-relaxed">
                                    A complete guide to state regulations, licensing requirements, Medicaid programs, and resident protection systems for assisted living and adult residential care in {stateDef.name}.
                                </p>
                            </header>

                            <div className="space-y-16">
                                {/* Medicaid Section */}
                                <section id="medicaid" className="scroll-mt-32">
                                    <h2 className="text-2xl font-light text-slate-900 mb-6 flex items-center gap-3">
                                        <ShieldCheck className="text-primary-600" />
                                        Medicaid Programs
                                    </h2>
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <ReactMarkdown>{data.medicaid_content}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* Licensing Section */}
                                <section id="licensing" className="scroll-mt-32">
                                    <h2 className="text-2xl font-light text-slate-900 mb-6 flex items-center gap-3">
                                        <Building2 className="text-primary-600" />
                                        Licensing Authority
                                    </h2>
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <ReactMarkdown>{data.licensing_content}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* Ombudsman Section */}
                                <section id="ombudsman" className="scroll-mt-32">
                                    <h2 className="text-2xl font-light text-slate-900 mb-6 flex items-center gap-3">
                                        <Users className="text-primary-600" />
                                        Ombudsman & Advocacy
                                    </h2>
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <ReactMarkdown>{data.ombudsman_content}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* Complaints Section */}
                                <section id="complaints" className="scroll-mt-32">
                                    <h2 className="text-2xl font-light text-slate-900 mb-6 flex items-center gap-3">
                                        <AlertCircle className="text-primary-600" />
                                        Complaint Process
                                    </h2>
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <ReactMarkdown>{data.complaints_content}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* Veterans Section */}
                                <section id="veterans" className="scroll-mt-32">
                                    <h2 className="text-2xl font-light text-slate-900 mb-6 flex items-center gap-3">
                                        <FileText className="text-primary-600" />
                                        Veterans Benefits
                                    </h2>
                                    <div className="prose prose-slate max-w-none text-slate-600">
                                        <ReactMarkdown>{data.veterans_content}</ReactMarkdown>
                                    </div>
                                </section>

                                {/* Verified Authority Contacts */}
                                {data.contacts_json && (
                                    <section id="contacts" className="scroll-mt-32">
                                        <div className="bg-slate-900 rounded-xl p-8 text-white shadow-xl">
                                            <h2 className="text-2xl font-light mb-8 flex items-center gap-3">
                                                <ShieldCheck className="text-green-400" />
                                                Verified Authority Contacts
                                            </h2>

                                            <div className="grid md:grid-cols-2 gap-8">
                                                {/* Licensing */}
                                                {data.contacts_json.licensing && (
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white mb-1">{data.contacts_json.licensing.name}</h3>
                                                        <p className="text-slate-400 text-sm mb-3">Licensing, inspections, enforcement</p>
                                                        <div className="space-y-2">
                                                            {data.contacts_json.licensing.phone && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <Phone size={16} />
                                                                    <a href={`tel:${data.contacts_json.licensing.phone}`} className="hover:text-white transition-colors">{data.contacts_json.licensing.phone}</a>
                                                                </div>
                                                            )}
                                                            {data.contacts_json.licensing.website && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <ExternalLink size={16} />
                                                                    <a href={data.contacts_json.licensing.website} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Visit Website</a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Ombudsman */}
                                                {data.contacts_json.ombudsman && (
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white mb-1">{data.contacts_json.ombudsman.name}</h3>
                                                        <p className="text-slate-400 text-sm mb-3">Resident rights, complaint resolution</p>
                                                        <div className="space-y-2">
                                                            {data.contacts_json.ombudsman.phone && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <Phone size={16} />
                                                                    <a href={`tel:${data.contacts_json.ombudsman.phone}`} className="hover:text-white transition-colors">{data.contacts_json.ombudsman.phone}</a>
                                                                </div>
                                                            )}
                                                            {data.contacts_json.ombudsman.website && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <ExternalLink size={16} />
                                                                    <a href={data.contacts_json.ombudsman.website} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Visit Website</a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Medicaid */}
                                                {data.contacts_json.medicaid && (
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white mb-1">{data.contacts_json.medicaid.name}</h3>
                                                        <p className="text-slate-400 text-sm mb-3">Waivers, eligibility, applications</p>
                                                        <div className="space-y-2">
                                                            {data.contacts_json.medicaid.phone && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <Phone size={16} />
                                                                    <a href={`tel:${data.contacts_json.medicaid.phone}`} className="hover:text-white transition-colors">{data.contacts_json.medicaid.phone}</a>
                                                                </div>
                                                            )}
                                                            {data.contacts_json.medicaid.website && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <ExternalLink size={16} />
                                                                    <a href={data.contacts_json.medicaid.website} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Visit Website</a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Veterans */}
                                                {data.contacts_json.veterans && (
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white mb-1">{data.contacts_json.veterans.name}</h3>
                                                        <p className="text-slate-400 text-sm mb-3">Veterans benefits, aid & attendance</p>
                                                        <div className="space-y-2">
                                                            {data.contacts_json.veterans.phone && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <Phone size={16} />
                                                                    <a href={`tel:${data.contacts_json.veterans.phone}`} className="hover:text-white transition-colors">{data.contacts_json.veterans.phone}</a>
                                                                </div>
                                                            )}
                                                            {data.contacts_json.veterans.website && (
                                                                <div className="flex items-center gap-2 text-slate-300">
                                                                    <ExternalLink size={16} />
                                                                    <a href={data.contacts_json.veterans.website} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">Visit Website</a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Elder Abuse */}
                                                {data.contacts_json.elderAbuse && (
                                                    <div>
                                                        <h3 className="text-lg font-medium text-white mb-1">{data.contacts_json.elderAbuse.name}</h3>
                                                        <p className="text-slate-400 text-sm mb-3">Mandatory reporting, urgent concerns</p>
                                                        <div className="space-y-2">
                                                            {data.contacts_json.elderAbuse.phone && (
                                                                <div className="flex items-center gap-2 text-red-400 font-medium">
                                                                    <Phone size={16} />
                                                                    <a href={`tel:${data.contacts_json.elderAbuse.phone}`} className="hover:text-red-300 transition-colors">{data.contacts_json.elderAbuse.phone}</a>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </section>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};
