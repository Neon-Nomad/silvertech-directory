import React, { useEffect, useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_STATES } from '@/src/data/states';
import {
  ChevronRight,
  ShieldCheck,
  FileText,
  Users,
  Building2,
  AlertCircle,
  Phone,
  ExternalLink,
  ArrowUp,
  BadgeCheck,
  Heart,
} from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import ReactMarkdown from 'react-markdown';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';
import { useScrollSpy } from '@/src/hooks/useScrollSpy';

interface RegulatoryData {
  state_slug: string;
  medicaid_content: string;
  licensing_content: string;
  ombudsman_content: string;
  complaints_content: string;
  veterans_content: string;
  contacts_json: {
    licensing?: { name: string; phone?: string; website?: string };
    ombudsman?: { name: string; phone?: string; website?: string };
    medicaid?: { name: string; phone?: string; website?: string };
    elderAbuse?: { name: string; phone?: string };
    veterans?: { name: string; phone?: string; website?: string };
  };
}

const SECTIONS = [
  {
    id: 'medicaid',
    title: 'Medicaid Programs',
    description: 'How to pay for care through state Medicaid waivers',
    icon: ShieldCheck,
    contentKey: 'medicaid_content' as const,
  },
  {
    id: 'licensing',
    title: 'Licensing & Oversight',
    description: 'How facilities are licensed and monitored',
    icon: Building2,
    contentKey: 'licensing_content' as const,
  },
  {
    id: 'ombudsman',
    title: 'Ombudsman & Advocacy',
    description: 'Resident rights and complaint resolution',
    icon: Users,
    contentKey: 'ombudsman_content' as const,
  },
  {
    id: 'complaints',
    title: 'Complaint Process',
    description: 'How to report problems and file complaints',
    icon: AlertCircle,
    contentKey: 'complaints_content' as const,
  },
  {
    id: 'veterans',
    title: 'Veterans Benefits',
    description: 'Aid & attendance, state veterans homes',
    icon: FileText,
    contentKey: 'veterans_content' as const,
  },
  {
    id: 'contacts',
    title: 'Verified Contacts',
    description: 'Official phone numbers and websites',
    icon: Phone,
    contentKey: null,
  },
];

const sectionIds = SECTIONS.map((s) => s.id);

export const StateRegulatoryHub: React.FC = () => {
  const { state: stateSlug } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find((s) => s.slug === stateSlug);

  const [data, setData] = useState<RegulatoryData | null>(null);
  const [loading, setLoading] = useState(true);

  const activeSection = useScrollSpy(sectionIds);

  useEffect(() => {
    async function loadData() {
      if (!stateSlug) return;

      // 1. Try static JSON first
      try {
        const regulations = import.meta.glob('../../src/generated/regulations/*.json');
        const fileSlug = stateSlug.replace(/-/g, '_');
        const loadRegulation = regulations[`../../src/generated/regulations/${fileSlug}.json`];

        if (loadRegulation) {
          const staticData: any = await loadRegulation();
          if (staticData) {
            setData(staticData.default || staticData);
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn(`Error loading static data for ${stateSlug}`, e);
      }

      // 2. Fetch from Supabase (live truth)
      try {
        const { data: liveData, error } = await supabase
          .from('regulatory_content')
          .select('*')
          .eq('state_slug', stateSlug)
          .single();

        if (liveData && !error) {
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

  // Key facts derived from contacts
  const keyFacts = useMemo(() => {
    if (!data?.contacts_json) return [];
    const facts = [];
    if (data.contacts_json.licensing?.name)
      facts.push({ label: 'Licensing Body', value: data.contacts_json.licensing.name, icon: Building2 });
    if (data.contacts_json.ombudsman?.name)
      facts.push({ label: 'Ombudsman Program', value: data.contacts_json.ombudsman.name, icon: Heart });
    if (data.contacts_json.medicaid?.name)
      facts.push({ label: 'Medicaid Agency', value: data.contacts_json.medicaid.name, icon: ShieldCheck });
    if (data.contacts_json.veterans?.name)
      facts.push({ label: 'Veterans Services', value: data.contacts_json.veterans.name, icon: BadgeCheck });
    return facts;
  }, [data]);

  if (!stateDef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">State Not Found</h1>
          <Link to="/regulatory-library" className="text-gold hover:underline">
            Return to Regulatory Library
          </Link>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-4 w-32 bg-slate-200 rounded mb-4" />
          <div className="h-2 w-48 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">
            {stateDef.name} Regulatory Guide
          </h1>
          <p className="text-slate-600 mb-6">
            We are currently compiling the regulatory data for {stateDef.name}. Please check back soon.
          </p>
          <Link to="/regulatory-library" className="text-gold hover:underline">
            Return to Regulatory Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${stateDef.name} Senior Living Regulations | SilverTech Directory`}</title>
        <meta
          name="description"
          content={`Complete guide to ${stateDef.name} senior living regulations, Medicaid waivers, licensing requirements, and how to pay for memory care and assisted living.`}
        />
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/regulatory`} />
      </Helmet>

      <div id="top" className="bg-warm-white min-h-screen">
        {/* ── Breadcrumbs ── */}
        <div className="border-b border-slate-200 bg-warm-gray">
          <div className="max-w-[1200px] mx-auto px-6 py-4">
            <div className="flex items-center text-sm text-slate-500">
              <Link to="/regulatory-library" className="hover:text-gold transition-colors">
                Regulatory Library
              </Link>
              <ChevronRight size={16} className="mx-2" />
              <span className="text-charcoal font-medium">{stateDef.name}</span>
            </div>
          </div>
        </div>

        {/* ── Hero / Intro ── */}
        <section className="bg-warm-gray border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-16">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-4 block">
              Verified Authority
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal mb-6 leading-tight">
              {stateDef.name} Senior Living Regulations & Resources
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
              A complete guide to state regulations, licensing requirements, Medicaid programs,
              and resident protection systems for assisted living and adult residential care in {stateDef.name}.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <ContentMeta />
            </div>
            <div className="mt-3">
              <DataSourceNote note="Regulatory content is compiled from official state agencies and public regulatory documents." />
            </div>
          </div>
        </section>

        {/* ── Key Facts Panel ── */}
        {keyFacts.length > 0 && (
          <section className="border-b border-slate-200">
            <div className="max-w-[1200px] mx-auto px-6 py-10">
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${keyFacts.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="bg-white border border-slate-200 rounded-xl p-5">
                    <fact.icon className="w-5 h-5 text-gold mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                      {fact.label}
                    </p>
                    <p className="text-sm font-semibold text-charcoal leading-snug">{fact.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Table of Contents (mobile) ── */}
        <div className="lg:hidden border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-6">On This Page</h2>
            <div className="space-y-3">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="flex items-start gap-3 group"
                >
                  <section.icon className="w-4 h-4 text-slate-400 group-hover:text-gold mt-0.5 transition-colors" />
                  <div>
                    <p className="text-sm font-semibold text-charcoal group-hover:text-gold transition-colors">
                      {section.title}
                    </p>
                    <p className="text-xs text-slate-500">{section.description}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Two-Column Layout ── */}
        <div className="max-w-[1200px] mx-auto px-6 py-12">
          <div className="flex gap-12">
            {/* Sticky Sidebar TOC — desktop */}
            <aside className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24">
                <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-6">
                  On This Page
                </h3>
                <nav className="space-y-1">
                  {SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
                        className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-md transition-all border-l-2 ${
                          isActive
                            ? 'text-gold font-semibold border-gold bg-warm-gray'
                            : 'text-slate-600 border-transparent hover:text-charcoal hover:bg-warm-gray'
                        }`}
                      >
                        <section.icon size={16} className={isActive ? 'text-gold' : 'text-slate-400'} />
                        {section.title}
                      </a>
                    );
                  })}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-16">
              {/* Regulation Sections */}
              {SECTIONS.filter((s) => s.contentKey !== null).map((section) => (
                <section key={section.id} id={section.id} className="scroll-mt-32">
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                    {section.title}
                  </span>
                  <h2 className="text-2xl font-serif font-bold text-charcoal mb-3 flex items-center gap-3">
                    <section.icon className="w-6 h-6 text-gold" />
                    {section.title}
                  </h2>
                  <p className="text-slate-500 mb-6 text-sm">{section.description}</p>

                  <div className="prose prose-slate max-w-none text-slate-600 prose-headings:font-serif prose-headings:text-charcoal prose-h3:text-lg prose-h4:text-base prose-a:text-gold prose-a:no-underline hover:prose-a:underline">
                    <ReactMarkdown>{data[section.contentKey!]}</ReactMarkdown>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <a
                      href="#top"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-gold transition-colors uppercase tracking-widest"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      Back to top
                    </a>
                  </div>
                </section>
              ))}

              {/* ── Verified Contacts Section ── */}
              {data.contacts_json && (
                <section id="contacts" className="scroll-mt-32">
                  <div className="bg-[#4A4A4A] rounded-2xl p-8 md:p-10 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                      Official Directory
                    </span>
                    <h2 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3">
                      <ShieldCheck className="text-gold" />
                      Verified Authority Contacts
                    </h2>

                    <div className="grid md:grid-cols-2 gap-8">
                      {data.contacts_json.licensing && (
                        <ContactCard
                          title={data.contacts_json.licensing.name}
                          subtitle="Licensing, inspections, enforcement"
                          phone={data.contacts_json.licensing.phone}
                          website={data.contacts_json.licensing.website}
                        />
                      )}
                      {data.contacts_json.ombudsman && (
                        <ContactCard
                          title={data.contacts_json.ombudsman.name}
                          subtitle="Resident rights, complaint resolution"
                          phone={data.contacts_json.ombudsman.phone}
                          website={data.contacts_json.ombudsman.website}
                        />
                      )}
                      {data.contacts_json.medicaid && (
                        <ContactCard
                          title={data.contacts_json.medicaid.name}
                          subtitle="Waivers, eligibility, applications"
                          phone={data.contacts_json.medicaid.phone}
                          website={data.contacts_json.medicaid.website}
                        />
                      )}
                      {data.contacts_json.veterans && (
                        <ContactCard
                          title={data.contacts_json.veterans.name}
                          subtitle="Veterans benefits, aid & attendance"
                          phone={data.contacts_json.veterans.phone}
                          website={data.contacts_json.veterans.website}
                        />
                      )}
                      {data.contacts_json.elderAbuse && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">
                            {data.contacts_json.elderAbuse.name}
                          </h3>
                          <p className="text-slate-400 text-sm mb-3">Mandatory reporting, urgent concerns</p>
                          {data.contacts_json.elderAbuse.phone && (
                            <div className="flex items-center gap-2 text-red-400 font-semibold">
                              <Phone size={16} />
                              <a href={`tel:${data.contacts_json.elderAbuse.phone}`} className="hover:text-red-300 transition-colors">
                                {data.contacts_json.elderAbuse.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-slate-100">
                    <a
                      href="#top"
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-gold transition-colors uppercase tracking-widest"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                      Back to top
                    </a>
                  </div>
                </section>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

/* ── Contact Card sub-component ── */
const ContactCard: React.FC<{
  title: string;
  subtitle: string;
  phone?: string;
  website?: string;
}> = ({ title, subtitle, phone, website }) => (
  <div>
    <h3 className="text-lg font-semibold text-white mb-1">{title}</h3>
    <p className="text-slate-400 text-sm mb-3">{subtitle}</p>
    <div className="space-y-2">
      {phone && (
        <div className="flex items-center gap-2 text-slate-300">
          <Phone size={16} />
          <a href={`tel:${phone}`} className="hover:text-gold transition-colors">
            {phone}
          </a>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-slate-300">
          <ExternalLink size={16} />
          <a href={website} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">
            Visit Website
          </a>
        </div>
      )}
    </div>
  </div>
);
