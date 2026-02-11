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
  ArrowRight,
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

/* ── Section definitions — all render inline on the hub page ── */
const SECTIONS = [
  {
    id: 'licensing',
    title: 'Licensing & Oversight',
    description: 'How communities are licensed, inspected, and monitored by the state',
    icon: Building2,
    contentKey: 'licensing_content' as const,
    topicSlug: 'licensing',
  },
  {
    id: 'ombudsman',
    title: 'Ombudsman & Resident Rights',
    description: 'Advocacy programs, resident protections, and complaint resolution',
    icon: Users,
    contentKey: 'ombudsman_content' as const,
    topicSlug: 'resident-rights',
  },
  {
    id: 'complaints',
    title: 'Complaint Process',
    description: 'How to report problems and what happens after a complaint is filed',
    icon: AlertCircle,
    contentKey: 'complaints_content' as const,
    topicSlug: 'complaints',
  },
  {
    id: 'medicaid',
    title: 'Medicaid Programs',
    description: 'Waivers, eligibility, and how to pay for care through Medicaid',
    icon: ShieldCheck,
    contentKey: 'medicaid_content' as const,
    topicSlug: undefined,
  },
  {
    id: 'veterans',
    title: 'Veterans Benefits',
    description: 'Aid & attendance, state veterans homes, and financial assistance',
    icon: FileText,
    contentKey: 'veterans_content' as const,
    topicSlug: undefined,
  },
  {
    id: 'contacts',
    title: 'Verified Contacts',
    description: 'Official phone numbers, websites, and reporting hotlines',
    icon: Phone,
    contentKey: null,
    topicSlug: undefined,
  },
];

const SECTION_IDS = SECTIONS.map((s) => s.id);

/* ── Hover preview config — links to topic article guides ── */
const TOPIC_GUIDES: Record<string, { title: string; caption: string; slug: string }> = {
  licensing: {
    title: 'Licensing Requirements Guide',
    caption: 'A plain-English breakdown of how licensing works.',
    slug: 'licensing',
  },
  ombudsman: {
    title: 'Resident Rights Guide',
    caption: 'What protections exist and how to advocate for a loved one.',
    slug: 'resident-rights',
  },
  complaints: {
    title: 'Complaint Process Guide',
    caption: 'Step-by-step: how to report a concern and what happens next.',
    slug: 'complaints',
  },
};

/* ── Helpers ── */
const getFirstParagraph = (markdown: string) => {
  const blocks = markdown
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);
  return blocks[0] || '';
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
    cards.push({
      title: currentTitle || 'Overview',
      summary: getFirstParagraph(body),
      official: body,
      sources: extractLinks(body),
    });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{2,4}\s+(.*)$/);
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
  return cleaned.length <= 140 ? cleaned : `${cleaned.slice(0, 137)}...`;
};

const getInsightFromText = (text: string) => {
  const lower = text.toLowerCase();
  if (/(staff|caregiver|ratio|direct care)/i.test(lower))
    return 'Ask how staff coverage is set for each shift and how ratios change overnight or on weekends.';
  if (/(training|orientation|in-service|continuing education)/i.test(lower))
    return 'Ask how training is delivered, how often it is refreshed, and which roles are required to complete it.';
  if (/(medication|medications|pharmacy|drug|administration|dispens)/i.test(lower))
    return 'Ask who administers medications, how they are documented, and how errors are reviewed.';
  if (/(evacuation|fire safety|emergency|disaster|drill)/i.test(lower))
    return 'Ask how often drills are performed and who coordinates emergency plans for residents with higher needs.';
  if (/(rights|grievance|complaint|retaliation)/i.test(lower))
    return 'Ask how residents and families are informed of their rights and how concerns are escalated.';
  if (/(inspection|survey|oversight|monitor)/i.test(lower))
    return 'Ask about the most recent inspection findings and how corrective actions were completed.';
  if (/(background check|screening|criminal|abuse registry)/i.test(lower))
    return 'Ask what screening is required before hire and how frequently staff are rechecked.';
  const phrase = stripMarkdown(text).split(' ').slice(0, 10).join(' ');
  if (!phrase) return '';
  return `This requirement shapes how the community handles ${phrase.toLowerCase()}. Ask how it is applied in daily operations.`;
};

const getMisunderstandingFromText = (text: string) => {
  const lower = text.toLowerCase();
  if (/(inspection|survey|oversight)/i.test(lower))
    return 'Inspections confirm minimum compliance at a point in time, not day-to-day excellence.';
  if (/(rights|complaint|grievance)/i.test(lower))
    return 'A complaint starts a review process; it is not an automatic penalty.';
  if (/(training|orientation)/i.test(lower))
    return 'Training requirements set minimums; quality varies based on how training is delivered.';
  return '';
};

const getQuestionsFromText = (text: string) => {
  const lower = text.toLowerCase();
  const questions: string[] = [];
  if (/(staff|caregiver|ratio|direct care)/i.test(lower))
    questions.push('How are staff ratios set for day, evening, and overnight shifts?');
  if (/(training|orientation|continuing education)/i.test(lower))
    questions.push('How often are staff required to complete training updates?');
  if (/(medication|pharmacy|drug|administration)/i.test(lower))
    questions.push('Who is authorized to administer medications, and how is documentation audited?');
  if (/(evacuation|fire|emergency|disaster|drill)/i.test(lower))
    questions.push('How frequently are emergency drills performed, and what is the last drill date?');
  if (/(rights|grievance|complaint)/i.test(lower))
    questions.push('What is the response timeline for resident or family complaints?');
  if (/(inspection|survey|oversight)/i.test(lower))
    questions.push('What were the most recent inspection findings and how were they resolved?');
  if (questions.length === 0) {
    const phrase = stripMarkdown(text).split(' ').slice(0, 10).join(' ');
    if (phrase) questions.push(`How do you comply with requirements related to ${phrase.toLowerCase()}?`);
  }
  return questions.slice(0, 2);
};

/* ══════════════════════════════════════════════════════════════
   Main Component
   ══════════════════════════════════════════════════════════════ */
export const StateRegulatoryHub: React.FC = () => {
  const { state: stateSlug } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find((s) => s.slug === stateSlug);

  const [data, setData] = useState<RegulatoryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoverPreview, setHoverPreview] = useState<string | null>(null);
  const previewTimer = useRef<number | null>(null);

  const activeSection = useScrollSpy(SECTION_IDS);

  const handlePreviewEnter = (id: string) => {
    if (!TOPIC_GUIDES[id]) return;
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
      try {
        const regulations = import.meta.glob('../../src/generated/regulations/*.json');
        const fileSlug = stateSlug.replace(/-/g, '_');
        const loader = regulations[`../../src/generated/regulations/${fileSlug}.json`];
        if (loader) {
          const staticData: any = await loader();
          if (staticData) {
            setData(staticData.default || staticData);
            setLoading(false);
          }
        }
      } catch (e) {
        console.warn(`Error loading static data for ${stateSlug}`, e);
      }
      try {
        const { data: liveData, error } = await supabase
          .from('regulatory_content')
          .select('*')
          .eq('state_slug', stateSlug)
          .single();
        if (liveData && !error) setData(liveData);
      } catch (e) {
        console.error('Error fetching live data', e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [stateSlug]);

  /* ── Derived data ── */
  const keyFacts = useMemo(() => {
    if (!data) return [];
    const facts: { label: string; value: string; icon: typeof Building2 }[] = [];
    const c = data.contacts_json;
    if (c?.licensing?.name) facts.push({ label: 'Licensing Body', value: c.licensing.name, icon: Building2 });
    if (c?.ombudsman?.name) facts.push({ label: 'Ombudsman', value: c.ombudsman.name, icon: Heart });
    if (c?.medicaid?.name) facts.push({ label: 'Medicaid Agency', value: c.medicaid.name, icon: ShieldCheck });
    if (c?.veterans?.name) facts.push({ label: 'Veterans Services', value: c.veterans.name, icon: FileText });
    if (facts.length === 0) {
      if (data.licensing_content) facts.push({ label: 'Licensing', value: 'State guide available', icon: Building2 });
      if (data.ombudsman_content) facts.push({ label: 'Ombudsman', value: 'Advocacy guide available', icon: Heart });
      if (data.medicaid_content) facts.push({ label: 'Medicaid', value: 'Waiver guide available', icon: ShieldCheck });
      if (data.veterans_content) facts.push({ label: 'Veterans', value: 'Benefits guide available', icon: FileText });
    }
    return facts;
  }, [data]);

  const hasContacts = useMemo(() => {
    const c = data?.contacts_json;
    return !!(c?.licensing?.name || c?.ombudsman?.name || c?.medicaid?.name || c?.veterans?.name || c?.elderAbuse?.name);
  }, [data]);

  const sourcesAndLinks = useMemo(() => {
    if (!data?.contacts_json) return [];
    const sources: { label: string; url?: string }[] = [];
    const c = data.contacts_json;
    if (c.licensing?.website) sources.push({ label: c.licensing.name || 'Licensing', url: c.licensing.website });
    if (c.ombudsman?.website) sources.push({ label: c.ombudsman.name || 'Ombudsman', url: c.ombudsman.website });
    if (c.medicaid?.website) sources.push({ label: c.medicaid.name || 'Medicaid', url: c.medicaid.website });
    if (c.veterans?.website) sources.push({ label: c.veterans.name || 'Veterans', url: c.veterans.website });
    return sources;
  }, [data]);

  /* ── JSON-LD structured data for SEO ── */
  const jsonLd = useMemo(() => {
    if (!stateDef) return null;
    const sectionNames = SECTIONS.filter((s) => s.contentKey).map((s) => s.title);
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: `${stateDef.name} Senior Living Regulations`,
        description: `Complete guide to ${stateDef.name} senior living regulations, Medicaid waivers, licensing requirements, and resident protections.`,
        author: { '@type': 'Organization', name: 'SilverTech Directory', url: 'https://silvertechdirectory.com' },
        publisher: { '@type': 'Organization', name: 'SilverTech Directory' },
        mainEntityOfPage: `https://silvertechdirectory.com/states/${stateDef.slug}/regulations`,
        about: sectionNames.map((name) => ({ '@type': 'Thing', name })),
      },
      {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://silvertechdirectory.com/' },
          { '@type': 'ListItem', position: 2, name: 'Regulatory Library', item: 'https://silvertechdirectory.com/regulatory-library' },
          { '@type': 'ListItem', position: 3, name: `${stateDef.name} Regulations`, item: `https://silvertechdirectory.com/states/${stateDef.slug}/regulations` },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: `What are the senior living regulations in ${stateDef.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${stateDef.name} regulates assisted living communities through state licensing, inspection, and oversight programs. This guide covers licensing requirements, Medicaid waivers, ombudsman services, complaint processes, and veterans benefits.`,
            },
          },
          {
            '@type': 'Question',
            name: `How do I file a complaint about a senior living facility in ${stateDef.name}?`,
            acceptedAnswer: {
              '@type': 'Answer',
              text: `${stateDef.name} has a formal complaint process for senior living facilities. Complaints can typically be filed with the state licensing authority or the Long-Term Care Ombudsman program. See the Complaint Process section for details.`,
            },
          },
        ],
      },
    ];
  }, [stateDef]);

  /* ── Empty / loading states ── */
  if (!stateDef) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center">
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">State Not Found</h1>
          <Link to="/regulatory-library" className="text-gold hover:underline">Return to Regulatory Library</Link>
        </div>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-4 w-40 bg-slate-200 rounded" />
          <div className="h-2 w-56 bg-slate-100 rounded" />
          <div className="h-2 w-48 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center max-w-md px-4">
          <h1 className="text-2xl font-serif font-bold text-charcoal mb-4">{stateDef.name} Regulatory Guide</h1>
          <p className="text-slate-600 mb-6">We are currently compiling the regulatory data for {stateDef.name}. Please check back soon.</p>
          <Link to="/regulatory-library" className="text-gold hover:underline">Return to Regulatory Library</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{`${stateDef.name} Senior Living Regulations | SilverTech Directory`}</title>
        <meta name="description" content={`Complete guide to ${stateDef.name} senior living regulations, Medicaid waivers, licensing requirements, and how to pay for memory care and assisted living.`} />
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/regulations`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={`${stateDef.name} Senior Living Regulations`} />
        <meta property="og:description" content={`Licensing, Medicaid, ombudsman, and complaint information for ${stateDef.name} assisted living communities.`} />
        <meta property="og:url" content={`https://silvertechdirectory.com/states/${stateDef.slug}/regulations`} />
        <meta name="twitter:card" content="summary_large_image" />
        {jsonLd && jsonLd.map((schema, i) => (
          <script key={i} type="application/ld+json">{JSON.stringify(schema)}</script>
        ))}
      </Helmet>

      <div id="top" className="bg-warm-white min-h-screen">
        {/* ── Breadcrumbs ── */}
        <div className="border-b border-slate-200 bg-warm-gray">
          <div className="max-w-[1200px] mx-auto px-6 py-4">
            <div className="flex items-center gap-1 text-sm text-slate-500">
              <Link to="/" className="hover:text-gold transition-colors">Home</Link>
              <ChevronRight size={14} className="text-slate-300" />
              <Link to="/regulatory-library" className="hover:text-gold transition-colors">Regulatory Library</Link>
              <ChevronRight size={14} className="text-slate-300" />
              <span className="text-charcoal font-medium">{stateDef.name}</span>
            </div>
          </div>
        </div>

        {/* ── Hero ── */}
        <section className="bg-warm-gray border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-16">
            <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-4 block">
              Verified Authority
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal mb-6 leading-tight">
              {stateDef.name} Senior Living Regulations
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
              The complete guide to licensing, Medicaid programs, resident protections, complaint processes,
              and veterans benefits for assisted living and adult residential care in {stateDef.name}.
            </p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <ContentMeta />
            </div>
            <div className="mt-3">
              <DataSourceNote note="Compiled from official state agencies and public regulatory documents." />
            </div>
          </div>
        </section>

        {/* ── Key Facts ── */}
        {keyFacts.length > 0 && (
          <section className="border-b border-slate-200">
            <div className="max-w-[1200px] mx-auto px-6 py-10">
              <div className={`grid grid-cols-1 sm:grid-cols-2 ${keyFacts.length >= 4 ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4`}>
                {keyFacts.map((fact) => (
                  <div key={fact.label} className="bg-white border border-slate-200 rounded-xl p-5">
                    <fact.icon className="w-5 h-5 text-gold mb-3" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{fact.label}</p>
                    <p className="text-sm font-semibold text-charcoal leading-snug">{fact.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── Mobile TOC ── */}
        <div className="lg:hidden border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-8">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-6">On This Page</h2>
            <div className="space-y-3">
              {SECTIONS.map((section) => (
                <a key={section.id} href={`#${section.id}`} className="flex items-start gap-3 group">
                  <section.icon className="w-4 h-4 text-slate-400 group-hover:text-gold mt-0.5 transition-colors" />
                  <div>
                    <p className="text-sm font-semibold text-charcoal group-hover:text-gold transition-colors">{section.title}</p>
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
                <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold mb-6">On This Page</h3>
                <nav className="space-y-1 relative">
                  {SECTIONS.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <a
                        key={section.id}
                        href={`#${section.id}`}
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
                          <p>{section.title}</p>
                          <p className="text-xs text-slate-500 font-normal">{section.description}</p>
                        </div>
                      </a>
                    );
                  })}

                  {/* Hover preview → links to topic article guide */}
                  {hoverPreview && TOPIC_GUIDES[hoverPreview] && stateDef && (
                    <Link
                      to={`/states/${stateDef.slug}/regulations/${TOPIC_GUIDES[hoverPreview].slug}`}
                      className="absolute left-full ml-4 top-0 w-[300px] bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden hover:border-gold transition-colors"
                      onMouseEnter={() => handlePreviewEnter(hoverPreview)}
                      onMouseLeave={handlePreviewLeave}
                    >
                      <div className="p-5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                          In-Depth Guide
                        </span>
                        <p className="text-sm font-semibold text-charcoal mb-1">{TOPIC_GUIDES[hoverPreview].title}</p>
                        <p className="text-xs text-slate-500 mb-3">{TOPIC_GUIDES[hoverPreview].caption}</p>
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-gold uppercase tracking-widest">
                          Read guide <ArrowRight className="w-3 h-3" />
                        </span>
                      </div>
                    </Link>
                  )}
                </nav>
              </div>
            </aside>

            {/* ── Main Content — all sections inline ── */}
            <div className="flex-1 min-w-0 space-y-16">

              {/* Content sections */}
              {SECTIONS.filter((s) => s.contentKey !== null).map((section) => {
                const content = data[section.contentKey!];
                if (!content) return null;
                const cards = parseRegulationCards(content);
                const sectionSummary = cards[0]?.summary || section.description;
                const contactSource =
                  section.id === 'licensing' ? data.contacts_json?.licensing
                  : section.id === 'ombudsman' ? data.contacts_json?.ombudsman
                  : section.id === 'complaints' ? data.contacts_json?.licensing
                  : section.id === 'medicaid' ? data.contacts_json?.medicaid
                  : section.id === 'veterans' ? data.contacts_json?.veterans
                  : undefined;
                const sectionQuestions = getQuestionsFromText(content);
                const topicGuide = section.topicSlug ? TOPIC_GUIDES[section.id] : null;

                return (
                  <section key={section.id} id={section.id} className="scroll-mt-28">
                    <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                      {/* Section header */}
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                        {section.title}
                      </span>
                      <h2 className="text-2xl font-serif font-bold text-charcoal mb-3 flex items-center gap-3">
                        <section.icon className="w-6 h-6 text-gold flex-shrink-0" />
                        {section.title}
                      </h2>
                      <p className="text-slate-600 text-sm mb-8 max-w-3xl">{sectionSummary}</p>

                      {/* Regulation cards */}
                      <div className="space-y-6">
                        {cards.map((card, index) => (
                          <RegulationCard
                            key={`${section.id}-${index}`}
                            title={card.title}
                            summary={toOneLineSummary(card.summary || card.official)}
                            official={card.official}
                            sources={card.sources}
                            insight={getInsightFromText(card.official)}
                            misunderstanding={index % 3 === 2 ? getMisunderstandingFromText(card.official) : ''}
                            sourceLabel={contactSource?.name || 'Official state source'}
                            sourceUrl={contactSource?.website}
                            plainEnglish={toPlainEnglish(card.summary || card.official)}
                          />
                        ))}
                      </div>

                      {/* Questions to ask */}
                      {sectionQuestions.length > 0 && (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3">
                            Questions to ask about this
                          </p>
                          <ul className="space-y-2 text-sm text-slate-600">
                            {sectionQuestions.map((q) => (
                              <li key={q} className="flex items-start gap-3">
                                <span className="mt-1.5 h-2 w-2 rounded-full bg-gold/60 flex-shrink-0" />
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Link to topic article guide */}
                      {topicGuide && stateDef && (
                        <div className="mt-8 border-t border-slate-100 pt-6">
                          <Link
                            to={`/states/${stateDef.slug}/regulations/${topicGuide.slug}`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal hover:text-gold transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Read the {topicGuide.title}
                          </Link>
                        </div>
                      )}

                      {/* Ombudsman link on complaints */}
                      {section.id === 'complaints' && (
                        <div className="mt-4">
                          <Link
                            to={`/states/${stateDef.slug}/ombudsman`}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-charcoal hover:text-gold transition-colors"
                          >
                            <ArrowRight className="w-4 h-4" />
                            Contact the Long-Term Care Ombudsman
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Back to top */}
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

              {/* ── Verified Contacts ── */}
              {hasContacts && (
                <section id="contacts" className="scroll-mt-28">
                  <div className="bg-slate-900 rounded-2xl p-8 md:p-10 text-white">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                      Official Directory
                    </span>
                    <h2 className="text-2xl font-serif font-bold mb-8 flex items-center gap-3">
                      <ShieldCheck className="text-gold" />
                      Verified Authority Contacts
                    </h2>
                    <div className="grid md:grid-cols-2 gap-8">
                      {data.contacts_json.licensing?.name && (
                        <ContactCard title={data.contacts_json.licensing.name} subtitle="Licensing, inspections, enforcement" phone={data.contacts_json.licensing.phone} website={data.contacts_json.licensing.website} />
                      )}
                      {data.contacts_json.ombudsman?.name && (
                        <ContactCard title={data.contacts_json.ombudsman.name} subtitle="Resident rights, complaint resolution" phone={data.contacts_json.ombudsman.phone} website={data.contacts_json.ombudsman.website} />
                      )}
                      {data.contacts_json.medicaid?.name && (
                        <ContactCard title={data.contacts_json.medicaid.name} subtitle="Waivers, eligibility, applications" phone={data.contacts_json.medicaid.phone} website={data.contacts_json.medicaid.website} />
                      )}
                      {data.contacts_json.veterans?.name && (
                        <ContactCard title={data.contacts_json.veterans.name} subtitle="Veterans benefits, aid & attendance" phone={data.contacts_json.veterans.phone} website={data.contacts_json.veterans.website} />
                      )}
                      {data.contacts_json.elderAbuse?.name && (
                        <div>
                          <h3 className="text-lg font-semibold text-white mb-1">{data.contacts_json.elderAbuse.name}</h3>
                          <p className="text-slate-400 text-sm mb-3">Mandatory reporting, urgent concerns</p>
                          {data.contacts_json.elderAbuse.phone && (
                            <div className="flex items-center gap-2 text-red-400 font-semibold">
                              <Phone size={16} />
                              <a href={`tel:${data.contacts_json.elderAbuse.phone}`} className="hover:text-red-300 transition-colors">{data.contacts_json.elderAbuse.phone}</a>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-6 pt-4 border-t border-slate-100">
                    <a href="#top" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-gold transition-colors uppercase tracking-widest">
                      <ArrowUp className="w-3.5 h-3.5" />
                      Back to top
                    </a>
                  </div>
                </section>
              )}

              {/* ── Sources & Links ── */}
              {sourcesAndLinks.length > 0 && (
                <section id="sources" className="scroll-mt-28">
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">Sources</span>
                    <h2 className="text-2xl font-serif font-bold text-charcoal mb-4">Official Sources</h2>
                    <div className="space-y-3">
                      {sourcesAndLinks.map((source) => (
                        <a key={source.label} href={source.url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-4 border border-slate-200 rounded-xl p-4 hover:border-gold transition-colors">
                          <span className="text-sm font-semibold text-charcoal">{source.label}</span>
                          <span className="text-xs text-slate-400 uppercase tracking-widest flex items-center gap-1">
                            Visit <ExternalLink size={12} />
                          </span>
                        </a>
                      ))}
                    </div>
                  </div>
                </section>
              )}

              {/* ── Topic Article Guides ── */}
              {stateDef && (
                <section className="scroll-mt-28">
                  <div className="bg-warm-gray border border-slate-200 rounded-2xl p-6 md:p-8">
                    <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">
                      In-Depth Guides
                    </span>
                    <h2 className="text-xl font-serif font-bold text-charcoal mb-6">
                      Explore {stateDef.name} Regulations by Topic
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {['licensing', 'inspections', 'staffing', 'resident-rights', 'complaints', 'memory-care'].map((slug) => (
                        <Link
                          key={slug}
                          to={`/states/${stateDef.slug}/regulations/${slug}`}
                          className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-gold hover:shadow-sm transition-all"
                        >
                          <p className="text-sm font-semibold text-charcoal group-hover:text-gold transition-colors capitalize">
                            {slug.replace(/-/g, ' ')}
                          </p>
                          <span className="inline-flex items-center gap-1 mt-2 text-xs text-slate-400 group-hover:text-gold transition-colors">
                            Read guide <ArrowRight className="w-3 h-3" />
                          </span>
                        </Link>
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

/* ── Sub-components ── */

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
          <a href={`tel:${phone}`} className="hover:text-gold transition-colors">{phone}</a>
        </div>
      )}
      {website && (
        <div className="flex items-center gap-2 text-slate-300">
          <ExternalLink size={16} />
          <a href={website} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">Visit Website</a>
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
  insight: string;
  misunderstanding: string;
  sourceLabel: string;
  sourceUrl?: string;
  plainEnglish: string;
}> = ({ title, summary, official, sources, insight, misunderstanding, sourceLabel, sourceUrl, plainEnglish }) => (
  <div className="border border-slate-200 rounded-xl p-5 bg-warm-white">
    <h3 className="text-lg font-serif font-semibold text-charcoal mb-2">{title}</h3>
    {summary && <p className="text-sm text-slate-600 leading-relaxed">{summary}</p>}

    {official && (
      <details className="mt-4">
        <summary className="text-xs font-semibold uppercase tracking-widest text-slate-500 cursor-pointer hover:text-gold transition-colors select-none">
          Official regulation text
        </summary>
        <div className="mt-3 prose prose-sm prose-slate max-w-none prose-headings:font-serif prose-headings:text-charcoal prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-table:text-sm prose-blockquote:border-l-gold">
          <ReactMarkdown>{official}</ReactMarkdown>
        </div>
      </details>
    )}

    {plainEnglish && (
      <div className="mt-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Plain-English summary</p>
        <p className="text-sm text-slate-600">{plainEnglish}</p>
      </div>
    )}

    {insight && (
      <div className="mt-4 rounded-lg bg-gold/10 border border-gold/20 p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-gold mb-2">SilverTech Insight</p>
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
          <a key={source} href={source} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-gold transition-colors">
            <ExternalLink size={12} /> Source
          </a>
        ))}
      </div>
    )}

    <div className="mt-4 text-xs text-slate-500 flex flex-wrap items-center gap-2">
      <span className="uppercase tracking-widest text-slate-400">Source:</span>
      {sourceUrl ? (
        <a href={sourceUrl} target="_blank" rel="noreferrer" className="hover:text-gold transition-colors">{sourceLabel}</a>
      ) : (
        <span>{sourceLabel}</span>
      )}
    </div>
  </div>
);
