import React, { useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { ALL_STATES } from '@/src/data/states';
import { useRegulatoryContent } from '@/src/hooks/useRegulatoryContent';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type TopicConfig = {
  title: string;
  summary: string;
  baseContentKey: 'licensing_content' | 'complaints_content' | 'ombudsman_content' | 'medicaid_content' | 'veterans_content';
  keywords: RegExp[];
};

const TOPIC_CONFIG: Record<string, TopicConfig> = {
  licensing: {
    title: 'Licensing Requirements',
    summary: 'A plain-English guide to how communities are licensed and monitored.',
    baseContentKey: 'licensing_content',
    keywords: [/license/i, /licensing/i, /application/i, /renewal/i, /oversight/i],
  },
  inspections: {
    title: 'Inspection Process',
    summary: 'How inspections work, what violations mean, and what families can check.',
    baseContentKey: 'licensing_content',
    keywords: [/inspection/i, /survey/i, /violation/i, /deficien/i, /monitor/i],
  },
  staffing: {
    title: 'Staffing Requirements',
    summary: 'What the state expects for staffing levels, training, and coverage.',
    baseContentKey: 'licensing_content',
    keywords: [/staff/i, /caregiver/i, /ratio/i, /training/i, /orientation/i],
  },
  'resident-rights': {
    title: 'Resident Rights',
    summary: 'Protections for residents and how concerns can be raised.',
    baseContentKey: 'ombudsman_content',
    keywords: [/rights/i, /grievance/i, /complaint/i, /retaliation/i, /advocate/i],
  },
  complaints: {
    title: 'Complaint Process',
    summary: 'How to report concerns, what happens next, and who can help.',
    baseContentKey: 'complaints_content',
    keywords: [/complaint/i, /report/i, /grievance/i, /investigat/i],
  },
  'memory-care': {
    title: 'Memory Care Regulations',
    summary: 'Rules specific to dementia and memory care programs.',
    baseContentKey: 'licensing_content',
    keywords: [/memory/i, /dementia/i, /cognitive/i, /alzheimer/i],
  },
};

const TOPIC_PREVIEW: Record<string, string> = {
  licensing: '/previews/regulations-licensing.png',
  inspections: '/previews/regulations-inspections.png',
  staffing: '/previews/regulations-staffing.png',
  'resident-rights': '/previews/regulations-resident-rights.png',
  complaints: '/previews/regulations-complaints.png',
  'memory-care': '/previews/regulations-memory-care.png',
};

const stripMarkdown = (text: string) =>
  text
    .replace(/\[(.*?)\]\((.*?)\)/g, '$1')
    .replace(/[`*_>#-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const getFirstParagraph = (markdown: string) => {
  const blocks = markdown
    .replace(/\r/g, '')
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  return blocks[0] || '';
};

const pickVariant = (key: string, variants: string[]) => {
  if (variants.length === 0) return '';
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) % 100000;
  }
  return variants[hash % variants.length];
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
      const cleaned = stripMarkdown(match);
      return cleaned.length > 160 ? `${cleaned.slice(0, 157)}...` : cleaned;
    }
  }
  return '';
};

const limitSentences = (text: string, maxSentences: number) => {
  const sentences = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  return sentences.slice(0, maxSentences).join(' ');
};

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

const getInsightFromText = (text: string) => {
  const lower = text.toLowerCase();
  const keyPhrase = stripMarkdown(text).split(' ').slice(0, 12).join(' ');
  const action = 'A good next step is to ask how this is handled during tours.';
  if (/(staff|caregiver|ratio|direct care)/i.test(lower)) {
    return [
      'It is normal to wonder how staffing works day to day.',
      'These rules focus on coverage and response expectations, not just headcount.',
      'When you visit, ask how ratios change by shift and who covers overnight needs.',
    ].join(' ');
  }
  if (/(training|orientation|in-service|continuing education)/i.test(lower)) {
    return [
      'Many families are unsure what training is actually required.',
      'This section sets expectations for how staff are prepared before providing care.',
      'Ask how training is delivered and how often it is refreshed.',
    ].join(' ');
  }
  if (/(medication|medications|pharmacy|drug|administration|dispens)/i.test(lower)) {
    return [
      'Medication rules can feel technical at first.',
      'They are meant to ensure safe handling, documentation, and oversight.',
      'Ask who administers meds and how errors are tracked and resolved.',
    ].join(' ');
  }
  if (/(evacuation|fire safety|emergency|disaster|drill)/i.test(lower)) {
    return [
      'Emergency planning is often overlooked until a crisis happens.',
      'These requirements are designed to protect residents during high-risk events.',
      'Ask how often drills occur and who leads evacuation planning.',
    ].join(' ');
  }
  if (/(rights|grievance|complaint|retaliation)/i.test(lower)) {
    return [
      'It is normal to wonder what rights are actually enforceable.',
      'These rules outline how residents can raise concerns and be heard.',
      'Ask how families are informed of rights and how complaints are escalated.',
    ].join(' ');
  }
  if (/(inspection|survey|oversight|monitor)/i.test(lower)) {
    return [
      'Many families assume inspections are rare or only happen after complaints.',
      'Inspections provide a snapshot of compliance and how issues are corrected.',
      'Ask about recent findings and what changed afterward.',
    ].join(' ');
  }
  if (!keyPhrase) return '';
  return [
    'It is normal to feel unsure about what this means at first.',
    `This section focuses on ${keyPhrase.toLowerCase()} and how communities should comply.`,
    action,
  ].join(' ');
};

const TOPIC_QUESTIONS: Record<string, string[]> = {
  licensing: [
    'Is your license current, and where can I verify it?',
    'When was your last inspection?',
    'Have there been any recent violations?',
  ],
  inspections: [
    'What were the findings in your most recent inspection?',
    'How were any issues resolved?',
    'Can I see a copy of the latest report?',
  ],
  staffing: [
    'How many caregivers are on duty overnight?',
    'What training do caregivers receive?',
    'How long have most staff members worked here?',
  ],
  'resident-rights': [
    'How do residents or families file complaints?',
    'What happens if a resident wants to move out?',
    'How do you handle concerns from families?',
  ],
  complaints: [
    'Who should families contact first if there is a concern?',
    'How are complaints handled internally?',
    'When should someone contact the ombudsman?',
  ],
  'memory-care': [
    'What extra training do memory care staff receive?',
    'How do you support residents who wander or become anxious?',
    'How do you communicate care changes to families?',
  ],
};

const extractTopicSections = (markdown: string, keywords: RegExp[]) => {
  if (!markdown) return [];
  const lines = markdown.replace(/\r/g, '').split('\n');
  const sections: { title: string; body: string }[] = [];
  let currentTitle = '';
  let currentBody: string[] = [];

  const pushSection = () => {
    const body = currentBody.join('\n').trim();
    if (!currentTitle && !body) return;
    sections.push({ title: currentTitle || 'Overview', body });
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{2,4}\s+(.*)$/);
    if (headingMatch) {
      pushSection();
      currentTitle = headingMatch[1].trim();
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  pushSection();

  const filtered = sections.filter((section) => {
    const haystack = `${section.title} ${section.body}`.toLowerCase();
    return keywords.some((keyword) => keyword.test(haystack));
  });

  return filtered.length > 0 ? filtered : sections.slice(0, 2);
};

const getTopicLinks = (stateSlug: string, currentTopic: string) => {
  const topics = Object.keys(TOPIC_CONFIG).filter((slug) => slug !== currentTopic);
  return topics.slice(0, 3).map((slug) => ({
    title: TOPIC_CONFIG[slug].title,
    href: `/states/${stateSlug}/regulations/${slug}`,
  }));
};

export const StateRegulationTopicPage: React.FC = () => {
  const { state, topic } = useParams<{ state: string; topic: string }>();
  const stateDef = ALL_STATES.find((s) => s.slug === state);
  const config = topic ? TOPIC_CONFIG[topic] : undefined;
  const { data, loading } = useRegulatoryContent(state);

  if (!stateDef || !config) {
    return <Navigate to="/" replace />;
  }

  const content = data?.[config.baseContentKey] || '';
  const topicSections = useMemo(() => extractTopicSections(content, config.keywords), [content, config.keywords]);
  const directAnswerRaw = topicSections.length > 0 ? toPlainEnglish(getFirstParagraph(topicSections[0].body)) : '';
  const directAnswer = limitSentences(directAnswerRaw, 3);
  const silverTechInsight = topicSections.length > 0 ? getInsightFromText(topicSections[0].body) : '';
  const questionsToAsk = TOPIC_QUESTIONS[topic] || [
    'Where can I verify your license and compliance history?',
    'Who is the point of contact for regulatory questions?',
  ];
  const relatedTopics = getTopicLinks(stateDef.slug, topic);
  const faqQuestions = topicSections.length > 0 ? [
    `What does ${config.title.toLowerCase()} mean in ${stateDef.name}?`,
    `How should families use ${config.title.toLowerCase()} when comparing communities?`,
  ] : [];
  const previewImage = TOPIC_PREVIEW[topic] || 'https://silvertechdirectory.com/hero.png';
  const updatedAt = (data as any)?.updated_at || (data as any)?.created_at;
  const updatedLabel = updatedAt
    ? new Date(updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Reviewed regularly';
  const hasTopicContent = topicSections.length > 0;
  const stateNotice = !hasTopicContent
    ? 'This page summarizes current guidance and verified information. Regulations and agency guidance can change, and SilverTech reviews these pages regularly to keep them accurate.'
    : '';
  const thinTopicTakeaway = !hasTopicContent
    ? `For families in ${stateDef.name}, the most important first step is verifying a community's license status and reviewing any available inspection history.`
    : '';

  const pageTitle = `${config.title} in ${stateDef.name} | SilverTech`;
  const pageDescription = `${config.summary} Learn what this means for families in ${stateDef.name}.`;

  const inspectionCadence = extractSnippet(content, [/inspection/i, /survey/i, /frequency/i, /annual/i, /month/i]);
  const complaintContact = data?.contacts_json?.ombudsman?.name || data?.contacts_json?.licensing?.name;
  const regulatorName = data?.contacts_json?.licensing?.name || 'the state licensing authority';
  const inspectionNote = inspectionCadence ? `Inspections follow ${inspectionCadence.toLowerCase()}.` : 'Inspection schedules are published by the state.';
  const introVariants = [
    `In ${stateDef.name}, assisted living communities are regulated by ${regulatorName}. ${inspectionNote} These rules focus on safety, staffing, and resident rights.`,
    `${stateDef.name} relies on ${regulatorName} to oversee assisted living communities. Families can verify a license through the state lookup. These standards emphasize transparency and accountability.`,
    `Assisted living in ${stateDef.name} is governed by ${regulatorName}. These requirements exist to protect residents and give families clear decision‑making signals.`,
    `Regulations in ${stateDef.name} are overseen by ${regulatorName}. They outline how communities should operate and what families can reasonably expect when comparing care.`,
    `In ${stateDef.name}, assisted living is overseen by ${regulatorName}, and inspection results can help you spot patterns that matter for day‑to‑day care.`,
    `${stateDef.name} publishes licensing records through ${regulatorName}, which makes it easier to compare communities when care quality and transparency matter most.`,
  ];
  const introLine = pickVariant(`${stateDef.slug}-${topic}-intro`, introVariants);
  const directAnswerVariants = [
    `In ${stateDef.name}, ${directAnswer}`,
    `To operate in ${stateDef.name}, communities must meet state standards that prioritize resident safety. ${directAnswer}`,
    `${stateDef.name} requires licensed communities to comply with inspection and oversight rules designed for transparency. ${directAnswer}`,
    `For decision‑making in ${stateDef.name}, the core requirement is a valid license and ongoing compliance. ${directAnswer}`,
  ];
  const directAnswerLine = directAnswer ? pickVariant(`${stateDef.slug}-${topic}-answer`, directAnswerVariants) : '';
  const insightLeadVariants = [
    'Many families are unsure how to interpret these rules at first.',
    'It is normal to have questions about what these requirements mean in practice.',
    'Most families want to know how these rules affect day‑to‑day care.',
    'If you are comparing communities, this section helps translate policy into practical signals.',
  ];
  const insightLead = pickVariant(`${stateDef.slug}-${topic}-insight`, insightLeadVariants);
  const quickFacts = [
    {
      label: 'Regulating agency',
      value: data?.contacts_json?.licensing?.name || 'State licensing authority',
      href: data?.contacts_json?.licensing?.website,
    },
    {
      label: 'How to verify a license',
      value: data?.contacts_json?.licensing?.website ? 'Official state website' : 'State regulatory portal',
      href: data?.contacts_json?.licensing?.website,
    },
    {
      label: 'Where complaints are filed',
      value: complaintContact || 'State ombudsman program',
      href: data?.contacts_json?.ombudsman?.website,
    },
  ];

  return (
    <div className="min-h-screen bg-warm-white text-charcoal">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://silvertechdirectory.com/states/${stateDef.slug}/regulations/${topic}`} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://silvertechdirectory.com/states/${stateDef.slug}/regulations/${topic}`} />
        <meta property="og:image" content={previewImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={previewImage} />
        {faqQuestions.length > 0 && (
          <script type="application/ld+json">
            {JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: faqQuestions.slice(0, 3).map((question) => ({
                '@type': 'Question',
                name: question,
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: directAnswer || pageDescription,
                },
              })),
            })}
          </script>
        )}
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://silvertechdirectory.com/' },
              { '@type': 'ListItem', position: 2, name: 'States', item: 'https://silvertechdirectory.com/states' },
              { '@type': 'ListItem', position: 3, name: stateDef.name, item: `https://silvertechdirectory.com/states/${stateDef.slug}` },
              { '@type': 'ListItem', position: 4, name: 'Regulations', item: `https://silvertechdirectory.com/states/${stateDef.slug}/regulations` },
              { '@type': 'ListItem', position: 5, name: config.title, item: `https://silvertechdirectory.com/states/${stateDef.slug}/regulations/${topic}` },
            ],
          })}
        </script>
      </Helmet>

      <div className="border-b border-slate-200 bg-warm-gray">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'States', path: '/states' },
              { label: stateDef.name, path: `/states/${stateDef.slug}` },
              { label: 'Regulations', path: `/states/${stateDef.slug}/regulations` },
              { label: config.title, path: `/states/${stateDef.slug}/regulations/${topic}` },
            ]}
          />
          <Link to={`/states/${stateDef.slug}/regulations`} className="inline-flex items-center text-sm text-slate-500 hover:text-gold">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to {stateDef.name} regulations
          </Link>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal mt-6 mb-3">
            {config.title} in {stateDef.name}
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl">
            {config.summary} This guide explains what it means for families in {stateDef.name}.
          </p>
          <p className="mt-3 text-sm text-slate-500 max-w-3xl">
            This guide explains what the rules mean and how families can use them when comparing communities.
          </p>
          <p className="mt-4 text-sm text-slate-600 max-w-3xl">
            {introLine}
          </p>
          {stateNotice && (
            <p className="mt-4 text-sm text-slate-500 max-w-3xl">
              {stateNotice}
            </p>
          )}
          <div className="mt-6">
            <ContentMeta />
          </div>
        </div>
      </div>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="border-b border-slate-200" />
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-10">
        <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10">
          <div className="space-y-8">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">Direct answer</span>
              <p className="text-slate-700 text-base leading-relaxed">
                {directAnswerLine || directAnswer || 'This rule sets baseline expectations for how communities operate and what families can ask about during tours. We are compiling the latest state guidance for this topic.'}
              </p>
              {thinTopicTakeaway && (
                <p className="mt-4 text-sm text-slate-600">
                  {thinTopicTakeaway}
                </p>
              )}
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">SilverTech explanation</span>
              <p className="text-slate-600 text-sm leading-relaxed">
                {silverTechInsight ? `${insightLead} ${silverTechInsight}` : 'Use this section to understand how the rule is applied in real day-to-day operations.'}
              </p>
              {topic === 'complaints' && (
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
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">Questions you can ask</span>
              <p className="text-xs text-slate-500 mb-3">
                When you visit or call a community, these questions can help you understand how the rules are applied in real life.
              </p>
              <div className="space-y-2 text-sm text-slate-600">
                {questionsToAsk.map((question) => (
                  <div key={question} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 rounded-full bg-gold/60 flex-shrink-0" />
                    <span>{question}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">Quick facts</span>
              <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-4">
                {quickFacts.map((fact) => (
                  <div key={fact.label} className="border border-slate-200 rounded-xl p-4 bg-warm-gray/60">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">{fact.label}</p>
                    {fact.href ? (
                      <a href={fact.href} target="_blank" rel="noreferrer" className="text-sm font-semibold text-charcoal hover:text-gold">
                        {fact.value}
                      </a>
                    ) : (
                      <p className="text-sm font-semibold text-charcoal">{fact.value}</p>
                    )}
                  </div>
                ))}
                <div className="border border-slate-200 rounded-xl p-4 bg-warm-gray/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Inspection cadence</p>
                  <p className="text-sm font-semibold text-charcoal">{inspectionCadence || 'See state inspection guidance'}</p>
                </div>
                <div className="border border-slate-200 rounded-xl p-4 bg-warm-gray/60">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Last reviewed</p>
                  <p className="text-sm font-semibold text-charcoal">{updatedLabel}</p>
                </div>
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-gold block mb-2">Official wording</span>
              {loading ? (
                <p className="text-slate-500 text-sm">Loading official guidance...</p>
              ) : hasTopicContent ? (
                <div className="prose prose-slate max-w-none text-slate-600 prose-headings:font-serif prose-headings:text-charcoal prose-h3:text-lg prose-h4:text-base prose-a:text-gold prose-a:no-underline hover:prose-a:underline">
                  {topicSections.map((section, index) => (
                    <div key={`${section.title}-${index}`} className="mb-6">
                      <h3>{section.title}</h3>
                      <ReactMarkdown>{section.body}</ReactMarkdown>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-slate-600 space-y-3">
                  <p>
                    Official wording varies by state and is typically hosted by the state licensing authority.
                  </p>
                  {data?.contacts_json?.licensing?.website && (
                    <a
                      href={data.contacts_json.licensing.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-gold"
                    >
                      <FileText className="w-4 h-4" />
                      View official state guidance
                    </a>
                  )}
                </div>
              )}
              <div className="mt-6">
                <DataSourceNote note="Sources are official state regulations and agency guidance." />
              </div>
            </section>
          </div>

          <aside className="space-y-6">
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-charcoal mb-4 uppercase tracking-widest">Related topics</h2>
              <div className="space-y-3">
                {relatedTopics.map((item) => (
                  <Link key={item.href} to={item.href} className="flex items-center justify-between gap-3 text-sm text-slate-600 hover:text-gold">
                    <span>{item.title}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                ))}
              </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-sm font-semibold text-charcoal mb-4 uppercase tracking-widest">Next steps for families</h2>
              <div className="space-y-3 text-sm text-slate-600">
                <Link to={`/search?location=${encodeURIComponent(stateDef.name)}`} className="flex items-center gap-2 hover:text-gold">
                  <ArrowRight className="w-4 h-4" />
                  Browse assisted living in {stateDef.name}
                </Link>
                <Link to="/resources/guides" className="flex items-center gap-2 hover:text-gold">
                  <ArrowRight className="w-4 h-4" />
                  Questions to ask on a tour
                </Link>
                <Link to={`/states/${stateDef.slug}`} className="flex items-center gap-2 hover:text-gold">
                  <ArrowRight className="w-4 h-4" />
                  Compare communities near you
                </Link>
              </div>
            </section>

            {data?.contacts_json?.licensing?.website && (
              <section className="bg-warm-gray border border-slate-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-sm font-semibold text-charcoal mb-4 uppercase tracking-widest">Official resources</h2>
                <a
                  href={data.contacts_json.licensing.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-gold"
                >
                  <FileText className="w-4 h-4" />
                  State licensing portal
                </a>
              </section>
            )}
          </aside>
        </div>
        <div className="mt-10 text-xs text-slate-500">
          SilverTech reviews state regulatory sources regularly to keep this information accurate and current.
        </div>
      </div>
    </div>
  );
};
