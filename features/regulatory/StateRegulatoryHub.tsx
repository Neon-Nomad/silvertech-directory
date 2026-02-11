import React, { useEffect, useState, useMemo, useRef } from 'react';
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
  ArrowRight,
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
    id: 'licensing',
    title: 'Licensing & Oversight',
    description: 'How facilities are licensed and monitored',
    icon: Building2,
    contentKey: 'licensing_content' as const,
    linkType: 'page' as const,
    topicSlug: 'licensing',
  },
  {
    id: 'inspections',
    title: 'Inspections & Violations',
    description: 'How inspections work and what violations mean',
    icon: ShieldCheck,
    contentKey: 'licensing_content' as const,
    linkType: 'page' as const,
    topicSlug: 'inspections',
  },
  {
    id: 'staffing',
    title: 'Staffing Requirements',
    description: 'Caregiver coverage and training expectations',
    icon: Users,
    contentKey: 'licensing_content' as const,
    linkType: 'page' as const,
    topicSlug: 'staffing',
  },
  {
    id: 'resident-rights',
    title: 'Resident Rights',
    description: 'Protections, advocacy, and complaint rights',
    icon: Heart,
    contentKey: 'ombudsman_content' as const,
    linkType: 'page' as const,
    topicSlug: 'resident-rights',
  },
  {
    id: 'memory-care',
    title: 'Memory Care Regulations',
    description: 'Dementia care requirements and program rules',
    icon: BadgeCheck,
    contentKey: 'licensing_content' as const,
    linkType: 'page' as const,
    topicSlug: 'memory-care',
  },
  {
    id: 'ombudsman',
    title: 'Ombudsman & Advocacy',
    description: 'Resident rights and complaint resolution',
    icon: Users,
    contentKey: 'ombudsman_content' as const,
    linkType: 'page' as const,
    linkUrl: 'ombudsman',
  },
  {
    id: 'complaints',
    title: 'Complaint Process',
    description: 'How to report problems and file complaints',
    icon: AlertCircle,
    contentKey: 'complaints_content' as const,
    linkType: 'page' as const,
    topicSlug: 'complaints',
  },
  {
    id: 'medicaid',
    title: 'Medicaid Programs',
    description: 'How to pay for care through state Medicaid waivers',
    icon: ShieldCheck,
    contentKey: 'medicaid_content' as const,
    linkType: 'anchor' as const,
  },
  {
    id: 'veterans',
    title: 'Veterans Benefits',
    description: 'Aid & attendance, state veterans homes',
    icon: FileText,
    contentKey: 'veterans_content' as const,
    linkType: 'anchor' as const,
  },
  {
    id: 'contacts',
    title: 'Verified Contacts',
    description: 'Official phone numbers and websites',
    icon: Phone,
    contentKey: null,
    linkType: 'anchor' as const,
  },
];

const sectionIds = SECTIONS.filter((section) => section.linkType !== 'page').map((section) => section.id);

const PREVIEW_MAP: Record<string, { title: string; caption: string; image: string }> = {
  licensing: {
    title: 'Licensing & Oversight',
    caption: 'How facilities are licensed and monitored.',
    image: '/previews/regulations-licensing.png',
  },
  inspections: {
    title: 'Inspection Process',
    caption: 'How inspections work and what violations mean.',
    image: '/previews/regulations-inspections.png',
  },
  staffing: {
    title: 'Staffing Requirements',
    caption: 'Coverage, training, and caregiver expectations.',
    image: '/previews/regulations-staffing.png',
  },
  'resident-rights': {
    title: 'Resident Rights',
    caption: 'Protections, advocacy, and complaint rights.',
    image: '/previews/regulations-resident-rights.png',
  },
  complaints: {
    title: 'Complaint Process',
    caption: 'How to report concerns and what happens next.',
    image: '/previews/regulations-complaints.png',
  },
  'memory-care': {
    title: 'Memory Care Rules',
    caption: 'Regulations specific to dementia care programs.',
    image: '/previews/regulations-memory-care.png',
  },
};

const getFirstParagraph = (markdown: string) => {
  const blocks = markdown
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks[0] || '';
};

const extractSnippet = (markdown: string, patterns: RegExp[]) => {
  const lines = markdown
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
  for (const pattern of patterns) {
    const match = lines.find((line) => pattern.test(line));
    if (match) {
      const cleaned = match.replace(/[#>*_`]/g, '').trim();
      return cleaned.length > 220 ? `${cleaned.slice(0, 217)}...` : cleaned;
    }
  }
  return '';
};

const extractLinks = (markdown: string) => {
  const links: string[] = [];
  const regex = /\((https?:\/\/[^)\s]+)\)/g;
  let match = regex.exec(markdown);
  while (match) {
    links.push(match[1]);
    match = regex.exec(markdown);
  }
  return Array.from(new Set(links));
};

const parseRegulationCards = (markdown: string) => {
  if (!markdown) return [];
  const lines = markdown.replace(/\r/g, '').split('\n');
  const cards: { title: string; summary: string; official: string; sources: string[] }[] = [];
  let currentTitle = '';
  let currentBody: string[] = [];

  const pushCard = () => {
    const body = currentBody.join('\n').trim();
    if (!currentTitle && !body) return;
    const summary = getFirstParagraph(body);
    cards.push({
      title: currentTitle || 'Overview',
      summary,
      official: body,
      sources: extractLinks(body),
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{3,4}\s+(.*)$/);
    if (headingMatch) {
      pushCard();
      currentTitle = headingMatch[1].trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }

  pushCard();
  return cards;
};

const stripMarkdown = (text: string) =>
  text
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[`*_>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const toPlainEnglish = (text: string) => {
  if (!text) return '';
  let output = stripMarkdown(text);
  output = output
    .replace(/\bshall\b/gi, 'are required to')
    .replace(/\bmust\b/gi, 'are required to')
    .replace(/\bmay not\b/gi, 'are not allowed to')
    .replace(/\bshall not\b/gi, 'are not allowed to')
    .replace(/\bfacility\b/gi, 'community');
  if (!/[.!?]$/.test(output)) output += '.';
  return output;
};

const toOneLineSummary = (text: string) => {
  const cleaned = stripMarkdown(text);
  if (cleaned.length <= 140) return cleaned;
  return `${cleaned.slice(0, 137)}...`;
};

const getKeyPhrase = (text: string) => {
  const cleaned = stripMarkdown(text);
  const words = cleaned.split(' ').filter(Boolean).slice(0, 10);
  return words.join(' ');
};

const getInsightFromText = (text: string) => {
  const lower = text.toLowerCase();
  if (/(staff|caregiver|ratio|direct care)/i.test(lower)) {
    return 'Ask how staff coverage is set for each shift and how ratios change overnight or on weekends.';
  }
  if (/(training|orientation|in-service|continuing education)/i.test(lower)) {
    return 'Ask how training is delivered, how often it is refreshed, and which roles are required to complete it.';
  }
  if (/(medication|medications|pharmacy|drug|administration|dispens)/i.test(lower)) {
    return 'Ask who administers medications, how they are documented, and how errors are reviewed.';
  }
  if (/(evacuation|fire safety|emergency|disaster|drill)/i.test(lower)) {
    return 'Ask how often drills are performed and who coordinates emergency plans for residents with higher needs.';
  }
  if (/(rights|grievance|complaint|retaliation)/i.test(lower)) {
    return 'Ask how residents and families are informed of their rights and how concerns are escalated.';
  }
  if (/(background check|screening|criminal|abuse registry)/i.test(lower)) {
    return 'Ask what screening is required before hire and how frequently staff are rechecked.';
  }
  if (/(inspection|survey|oversight|monitor)/i.test(lower)) {
    return 'Ask about the most recent inspection findings and how corrective actions were completed.';
  }
  if (/(infection|sanitation|hygiene|health)/i.test(lower)) {
    return 'Ask about infection control routines and how outbreaks are managed.';
  }
  if (/(diet|nutrition|meal|food)/i.test(lower)) {
    return 'Ask how special diets are handled and how meal plans are reviewed.';
  }
  const phrase = getKeyPhrase(text);
  if (!phrase) return '';
  return `This requirement shapes how the community handles ${phrase.toLowerCase()}. Ask how it is applied in daily operations.`;
};

const getMisunderstandingFromText = (text: string) => {
  const lower = text.toLowerCase();
  if (/(inspection|survey|oversight)/i.test(lower)) {
    return 'Inspections confirm minimum compliance at a point in time, not day-to-day excellence.';
  }
  if (/(rights|complaint|grievance)/i.test(lower)) {
    return 'A complaint starts a review process; it is not an automatic penalty.';
  }
  if (/(training|orientation)/i.test(lower)) {
    return 'Training requirements set minimums; quality varies based on how training is delivered.';
  }
  return '';
};

const getQuestionsFromText = (text: string) => {
  const lower = text.toLowerCase();
  const questions: string[] = [];
  if (/(staff|caregiver|ratio|direct care)/i.test(lower)) {
    questions.push('How are staff ratios set for day, evening, and overnight shifts?');
  }
  if (/(training|orientation|continuing education)/i.test(lower)) {
    questions.push('How often are staff required to complete training updates?');
  }
  if (/(medication|pharmacy|drug|administration)/i.test(lower)) {
    questions.push('Who is authorized to administer medications, and how is documentation audited?');
  }
  if (/(evacuation|fire|emergency|disaster|drill)/i.test(lower)) {
    questions.push('How frequently are emergency drills performed, and what is the last drill date?');
  }
  if (/(rights|grievance|complaint)/i.test(lower)) {
    questions.push('What is the response timeline for resident or family complaints?');
  }
  if (/(inspection|survey|oversight)/i.test(lower)) {
    questions.push('What were the most recent inspection findings and how were they resolved?');
  }
  if (questions.length === 0) {
    const phrase = getKeyPhrase(text);
    if (phrase) {
      questions.push(`How do you comply with requirements related to ${phrase.toLowerCase()}?`);
    }
  }
  return questions.slice(0, 2);
};


export const StateRegulatoryHub: React.FC = () => {
  const { state: stateSlug } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find((s) => s.slug === stateSlug);

  const [data, setData] = useState<RegulatoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverPreview, setHoverPreview] = useState<string | null>(null);
  const previewTimer = useRef<number | null>(null);

  const activeSection = useScrollSpy(sectionIds);

  const handlePreviewEnter = (id: string) => {
    if (!PREVIEW_MAP[id]) return;
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    previewTimer.current = window.setTimeout(() => setHoverPreview(id), 200);
  };

  const handlePreviewLeave = () => {
    if (previewTimer.current) window.clearTimeout(previewTimer.current);
    setHoverPreview(null);
  };

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

  const quickSummary = useMemo(() => {
    if (!data) return [];
    const items: { label: string; value: string; href?: string }[] = [];
    if (data.contacts_json?.licensing?.name) {
      items.push({
        label: 'Licensing Authority',
        value: data.contacts_json.licensing.name,
        href: '#licensing',
      });
    }
    const inspectionSnippet = extractSnippet(data.licensing_content || '', [
      /inspection/i,
      /survey/i,
      /monitor/i,
      /oversight/i,
    ]);
    if (inspectionSnippet) {
      items.push({
        label: 'Inspection Frequency',
        value: inspectionSnippet,
        href: '#licensing',
      });
    }
    const complaintSnippet = extractSnippet(data.complaints_content || '', [
      /complaint/i,
      /report/i,
      /grievance/i,
    ]);
    if (complaintSnippet) {
      items.push({
        label: 'Complaint Process',
        value: complaintSnippet,
        href: '#complaints',
      });
    }
    return items;
  }, [data]);

  const sourcesAndLinks = useMemo(() => {
    if (!data?.contacts_json) return [];
    const sources: { label: string; url?: string }[] = [];
    if (data.contacts_json.licensing?.website) {
      sources.push({ label: data.contacts_json.licensing.name, url: data.contacts_json.licensing.website });
    }
    if (data.contacts_json.ombudsman?.website) {
      sources.push({ label: data.contacts_json.ombudsman.name, url: data.contacts_json.ombudsman.website });
    }
    if (data.contacts_json.medicaid?.website) {
      sources.push({ label: data.contacts_json.medicaid.name, url: data.contacts_json.medicaid.website });
    }
    if (data.contacts_json.veterans?.website) {
      sources.push({ label: data.contacts_json.veterans.name, url: data.contacts_json.veterans.website });
    }
    return sources;
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
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/regulations`} />
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
        {/* â”€â”€ Quick Summary â”€â”€ */}
        {quickSummary.length > 0 && (
          <section className="border-b border-slate-200">
            <div className="max-w-[1200px] mx-auto px-6 py-10">
              <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
                  <h2 className="text-lg md:text-xl font-serif font-bold text-charcoal">Quick Summary</h2>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold">At a glance</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {quickSummary.map((item) => (
                    <div key={item.label} className="border border-slate-200 rounded-xl p-4 bg-warm-gray/60">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                        {item.label}
                      </p>
                      {item.href ? (
                        <a href={item.href} className="text-sm font-semibold text-charcoal hover:text-gold transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <p className="text-sm font-semibold text-charcoal">{item.value}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        <div className="lg:hidden border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-8">
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-6">On This Page</h2>
            <div className="space-y-3">
              {SECTIONS.map((section) => (
                <a
                  key={section.id}
                  href={
                    section.linkType === 'page' && stateDef
                      ? section.linkUrl
                        ? `/states/${stateDef.slug}/${section.linkUrl}`
                        : `/states/${stateDef.slug}/regulations/${section.topicSlug}`
                      : `#${section.id}`
                  }
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
                <nav className="space-y-1 relative">
                  {SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    const href =
                      section.linkType === 'page' && stateDef
                        ? section.linkUrl
                          ? `/states/${stateDef.slug}/${section.linkUrl}`
                          : `/states/${stateDef.slug}/regulations/${section.topicSlug}`
                        : `#${section.id}`;
                    return (
                      <a
                        key={section.id}
                        href={href}
                        className={`flex items-start gap-3 px-3 py-2.5 text-sm rounded-md transition-all border-l-2 ${
                          isActive
                            ? 'text-gold font-semibold border-gold bg-warm-gray'
                            : 'text-slate-600 border-transparent hover:text-charcoal hover:bg-warm-gray'
                        }`}
                        onMouseEnter={() => handlePreviewEnter(section.id)}
                        onMouseLeave={handlePreviewLeave}
                      >
                        <section.icon size={16} className={isActive ? 'text-gold' : 'text-slate-400'} />
                        <div>
                          <p className="text-sm">{section.title}</p>
                          <p className="text-xs text-slate-500">{section.description}</p>
                        </div>
                      </a>
                    );
                  })}

                  {hoverPreview && PREVIEW_MAP[hoverPreview] && (
                    <div
                      className="absolute left-full ml-6 top-0 w-[340px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
                      onMouseEnter={() => handlePreviewEnter(hoverPreview)}
                      onMouseLeave={handlePreviewLeave}
                    >
                      <div className="bg-slate-100">
                        <img
                          src={PREVIEW_MAP[hoverPreview].image}
                          alt={`${PREVIEW_MAP[hoverPreview].title} preview`}
                          className="w-full h-[200px] object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-sm font-semibold text-charcoal mb-1">{PREVIEW_MAP[hoverPreview].title}</p>
                        <p className="text-xs text-slate-500">{PREVIEW_MAP[hoverPreview].caption}</p>
                        <p className="text-[10px] uppercase tracking-widest text-slate-400 mt-2">Preview of guide</p>
                      </div>
                    </div>
                  )}
                </nav>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0 space-y-16">
              {/* Regulation Sections */}
              {SECTIONS.filter((s) => s.contentKey !== null && s.linkType !== 'page').map((section) => {
                const cards = parseRegulationCards(data[section.contentKey!]);
                const sectionSummary = cards[0]?.summary || section.description;
                const sectionSource =
                  section.id === 'licensing' || section.id === 'inspections' || section.id === 'staffing' || section.id === 'memory-care'
                    ? data.contacts_json?.licensing
                    : section.id === 'ombudsman' || section.id === 'resident-rights'
                      ? data.contacts_json?.ombudsman
                      : section.id === 'medicaid'
                        ? data.contacts_json?.medicaid
                        : section.id === 'veterans'
                          ? data.contacts_json?.veterans
                          : undefined;
                const sectionQuestions = getQuestionsFromText(data[section.contentKey!]);
                return (
                  <section key={section.id} id={section.id} className="scroll-mt-32">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                        {section.title}
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-charcoal mb-3 flex items-center gap-3">
                        <section.icon className="w-6 h-6 text-gold" />
                        {section.title}
                      </h2>
                      <p className="text-slate-600 text-sm mb-8">{sectionSummary}</p>

                      <div className="space-y-6">
                        {cards.map((card, index) => (
                          <RegulationCard
                            key={`${section.id}-${index}`}
                            title={card.title}
                            summary={toOneLineSummary(card.summary || card.official)}
                            official={card.official}
                            sources={card.sources}
                            sectionId={section.id}
                            insight={getInsightFromText(card.official)}
                            insightLabel="SilverTech Insight"
                            misunderstanding={index % 3 === 2 ? getMisunderstandingFromText(card.official) : ''}
                            sourceLabel={sectionSource?.name || 'Official state source'}
                            sourceUrl={sectionSource?.website}
                            plainEnglish={toPlainEnglish(card.summary || card.official)}
                          />
                        ))}
                      </div>

                      {section.id === 'complaints' && (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                          <Link
                            to={`/states/${stateDef.slug}/ombudsman`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal hover:text-gold transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Contact the Long-Term Care Ombudsman
                          </Link>
                        </div>
                      )}

                      {sectionQuestions.length > 0 && (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                            Questions to ask about this
                          </p>
                          <ul className="space-y-2 text-sm text-slate-600">
                            {sectionQuestions.map((question) => (
                              <li key={question} className="flex items-start gap-3">
                                <span className="mt-1 h-2 w-2 rounded-full bg-gold/60 flex-shrink-0" />
                                <span>{question}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100">
                      <a
                        href="#top"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-gold transition-colors uppercase tracking-widest"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                        Back to top
                      </a>
                    </div>
                  </section>
                );
              })}

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

              {sourcesAndLinks.length > 0 && (
                <section id="sources" className="scroll-mt-32">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                      Sources & Links
                    </span>
                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Official Sources</h2>
                    <div className="space-y-3">
                      {sourcesAndLinks.map((source) => (
                        <a
                          key={source.label}
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-between gap-4 border border-slate-200 rounded-xl p-4 hover:border-gold transition-colors"
                        >
                          <span className="text-sm font-semibold text-charcoal">{source.label}</span>
                          <span className="text-xs text-slate-400 uppercase tracking-widest">Visit</span>
                        </a>
                      ))}
                    </div>
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

const RegulationCard: React.FC<{
  title: string;
  summary: string;
  official: string;
  sources: string[];
  sectionId: string;
  insight: string;
  insightLabel: string;
  misunderstanding: string;
  sourceLabel: string;
  sourceUrl?: string;
  plainEnglish: string;
}> = ({ title, summary, official, sources, insight, insightLabel, misunderstanding, sourceLabel, sourceUrl, plainEnglish }) => (
  <div className="border border-slate-200 rounded-xl p-5 bg-warm-white">
    <div>
      <h3 className="text-lg font-serif font-semibold text-charcoal mb-2">{title}</h3>
      {summary && (
        <p className="text-sm text-slate-600 leading-relaxed">
          {summary}
        </p>
      )}
    </div>

    {official && (
      <details className="mt-4">
        <summary className="text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer hover:text-gold transition-colors">
          Official regulation
        </summary>
        <div className="mt-3 prose prose-slate max-w-none text-slate-600 prose-headings:font-serif prose-headings:text-charcoal prose-h3:text-lg prose-h4:text-base prose-a:text-gold prose-a:no-underline hover:prose-a:underline">
          <ReactMarkdown>{official}</ReactMarkdown>
        </div>
      </details>
    )}

    {plainEnglish && (
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-2">Plain-English summary</p>
        <p className="text-sm text-slate-600">{plainEnglish}</p>
      </div>
    )}

    {insight && (
      <div className="mt-4 rounded-lg bg-gold/10 border border-gold/20 p-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-gold mb-2">{insightLabel}</p>
        <p className="text-sm text-slate-700">{insight}</p>
      </div>
    )}

    {misunderstanding && (
      <div className="mt-3 text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-widest text-slate-400 mr-2">Common misunderstanding:</span>
        {misunderstanding}
      </div>
    )}

    {sources.length > 0 && (
      <div className="mt-4 flex flex-wrap gap-3">
        {sources.slice(0, 2).map((source) => (
          <a
            key={source}
            href={source}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-gold transition-colors"
          >
            <ExternalLink size={12} />
            Source link
          </a>
        ))}
      </div>
    )}

    <div className="mt-4 text-xs text-slate-500 flex flex-wrap items-center gap-2">
      <span className="uppercase tracking-widest text-slate-400">Source:</span>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">
          {sourceLabel}
        </a>
      ) : (
        <span>{sourceLabel}</span>
      )}
    </div>
  </div>
);
