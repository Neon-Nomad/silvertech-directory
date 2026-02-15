import React, { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Check, ClipboardCopy, Download, HelpCircle, Mail, Search } from 'lucide-react';
import { getHelpRouteContent } from '@/src/config/helpRegistry';
import { HelpArticle, HelpRouteContent, HelpRouteKey } from '@/src/types/helpRegistry';

interface HelpCenterProps {
  routeKey: HelpRouteKey;
}

const articleMatches = (article: HelpArticle, searchTerm: string): boolean => {
  if (!searchTerm.trim()) return true;
  const needle = searchTerm.trim().toLowerCase();
  return (
    article.title.toLowerCase().includes(needle) ||
    article.content_md.toLowerCase().includes(needle) ||
    article.slug.toLowerCase().includes(needle)
  );
};

export const HelpCenter: React.FC<HelpCenterProps> = ({ routeKey }) => {
  const readHashSlug = (): string | null => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash.replace(/^#/, '').trim();
    return hash || null;
  };

  const [content, setContent] = useState<HelpRouteContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [issueSummary, setIssueSummary] = useState('');
  const [errorCode, setErrorCode] = useState('');
  const [reproSteps, setReproSteps] = useState('');
  const [copied, setCopied] = useState(false);
  const [activeSlug, setActiveSlug] = useState<string | null>(() => readHashSlug());

  useEffect(() => {
    let isActive = true;

    const load = async () => {
      setLoading(true);
      const nextContent = await getHelpRouteContent(routeKey);
      if (!isActive) return;
      setContent(nextContent);
      setLoading(false);
    };

    load();
    return () => {
      isActive = false;
    };
  }, [routeKey]);

  const filteredArticles = useMemo(() => {
    if (!content) return [];
    return content.articles.filter((article) => articleMatches(article, search));
  }, [content, search]);

  useEffect(() => {
    if (typeof window === 'undefined' || !content) return;

    const syncHashState = () => {
      const hash = readHashSlug();
      if (!hash) {
        setActiveSlug(null);
        return;
      }
      const hasMatch = content.articles.some((article) => article.slug === hash);
      if (!hasMatch) {
        setActiveSlug(null);
        return;
      }
      setActiveSlug(hash);
      requestAnimationFrame(() => {
        const node = document.getElementById(hash);
        if (node) node.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    syncHashState();
    window.addEventListener('hashchange', syncHashState);
    return () => {
      window.removeEventListener('hashchange', syncHashState);
    };
  }, [content, routeKey]);

  const supportPacket = useMemo(() => {
    const now = new Date();
    const localStamp = now.toLocaleString();
    const utcStamp = now.toISOString();
    const path = typeof window !== 'undefined' ? window.location.pathname + window.location.search : '';
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';

    return [
      'SilverTech Support Packet',
      '',
      `Route Key: ${routeKey}`,
      `Current Path: ${path}`,
      `Local Time: ${localStamp}`,
      `UTC Time: ${utcStamp}`,
      `Error Code: ${errorCode || 'n/a'}`,
      '',
      `Issue Summary: ${issueSummary || 'n/a'}`,
      '',
      'Reproduction Steps:',
      reproSteps || 'n/a',
      '',
      `User Agent: ${userAgent}`,
    ].join('\n');
  }, [routeKey, issueSummary, errorCode, reproSteps]);

  const copySupportPacket = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(supportPacket);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = supportPacket;
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch (err) {
      console.error('Failed to copy support packet', err);
      setCopied(false);
    }
  };

  const downloadSupportPacket = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `silvertech-support-packet-${timestamp}.txt`;
    const blob = new Blob([supportPacket], { type: 'text/plain;charset=utf-8' });
    const blobUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(blobUrl);
  };

  const supportEmail = 'support@silvertechdirectory.com';
  const emailSubject = useMemo(() => {
    const summary = issueSummary.trim() || `Support request (${routeKey})`;
    return `SilverTech Support: ${summary}`;
  }, [issueSummary, routeKey]);
  const emailHref = useMemo(() => {
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(supportPacket);
    return `mailto:${supportEmail}?subject=${encodedSubject}&body=${encodedBody}`;
  }, [emailSubject, supportPacket]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-warm-gray bg-white p-6">
        <div className="animate-pulse space-y-3">
          <div className="h-5 w-48 bg-slate-200 rounded" />
          <div className="h-4 w-full bg-slate-100 rounded" />
          <div className="h-4 w-4/5 bg-slate-100 rounded" />
          <div className="h-4 w-2/3 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="rounded-2xl border border-warm-gray bg-white p-6">
        <p className="text-sm text-charcoal/70">Help content is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-warm-gray bg-white p-6">
        <div className="flex items-center gap-2 text-charcoal">
          <HelpCircle className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{content.route.title}</h2>
        </div>
        <p className="mt-2 text-sm text-charcoal/70">{content.route.contextual_tip}</p>
        <p className="mt-1 text-xs text-charcoal/50">Last updated: {content.lastUpdated}</p>

        <label className="mt-4 flex min-h-11 items-center gap-2 rounded-xl border border-warm-gray px-3 text-sm text-charcoal/70">
          <Search className="h-4 w-4" />
          <span className="sr-only">Search help articles</span>
          <input
            type="search"
            className="w-full border-0 bg-transparent py-2 text-charcoal focus:outline-none focus:ring-0"
            placeholder="Search this help section..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>

        <div className="mt-4 flex flex-wrap gap-2">
          {filteredArticles.slice(0, 8).map((article) => (
            <a
              key={article.id}
              href={`#${article.slug}`}
              onClick={() => setActiveSlug(article.slug)}
              className="rounded-full border border-warm-gray px-3 py-1 text-xs text-charcoal/70 hover:bg-warm-white hover:text-charcoal"
            >
              {article.title}
            </a>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-warm-gray bg-white p-6 space-y-4">
        <h3 className="text-base font-semibold text-charcoal">Support Packet Generator</h3>
        <p className="text-sm text-charcoal/70">
          Capture issue details in one format so support can triage faster.
        </p>

        <div className="grid grid-cols-1 gap-3">
          <label className="text-sm text-charcoal/80">
            <span className="block mb-1">Issue summary</span>
            <input
              data-testid="support-issue-summary"
              type="text"
              value={issueSummary}
              onChange={(event) => setIssueSummary(event.target.value)}
              className="w-full rounded-xl border border-warm-gray px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Short description of the issue"
            />
          </label>

          <label className="text-sm text-charcoal/80">
            <span className="block mb-1">Error code (optional)</span>
            <input
              data-testid="support-error-code"
              type="text"
              value={errorCode}
              onChange={(event) => setErrorCode(event.target.value)}
              className="w-full rounded-xl border border-warm-gray px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="Example: ERR_SLOT_LIMIT"
            />
          </label>

          <label className="text-sm text-charcoal/80">
            <span className="block mb-1">Reproduction steps</span>
            <textarea
              data-testid="support-repro-steps"
              value={reproSteps}
              onChange={(event) => setReproSteps(event.target.value)}
              className="min-h-24 w-full rounded-xl border border-warm-gray px-3 py-2 text-sm text-charcoal focus:outline-none focus:ring-2 focus:ring-slate-300"
              placeholder="1) Go to... 2) Click... 3) Observe..."
            />
          </label>
        </div>

        <div className="rounded-xl border border-warm-gray bg-slate-50 p-3">
          <pre data-testid="support-packet-preview" className="whitespace-pre-wrap break-words text-xs text-charcoal/80">
            {supportPacket}
          </pre>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="copy-support-packet"
            onClick={copySupportPacket}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            {copied ? <Check className="h-4 w-4" /> : <ClipboardCopy className="h-4 w-4" />}
            {copied ? 'Copied' : 'Copy Support Packet'}
          </button>
          <button
            type="button"
            data-testid="download-support-packet"
            onClick={downloadSupportPacket}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-warm-gray bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-warm-white"
          >
            <Download className="h-4 w-4" />
            Download .txt
          </button>
          <a
            data-testid="email-support-packet"
            href={emailHref}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-warm-gray bg-white px-4 py-2 text-sm font-semibold text-charcoal hover:bg-warm-white"
          >
            <Mail className="h-4 w-4" />
            Email Support
          </a>
        </div>
      </section>

      <section className="space-y-4">
        {filteredArticles.length === 0 ? (
          <div className="rounded-2xl border border-warm-gray bg-white p-6">
            <p className="text-sm text-charcoal/70">No help articles matched your search.</p>
          </div>
        ) : (
          filteredArticles.map((article) => (
            <article
              id={article.slug}
              key={article.id}
              data-testid={`help-article-${article.slug}`}
              className={`rounded-2xl border bg-white p-6 ${
                activeSlug === article.slug ? 'border-slate-400 ring-2 ring-slate-200' : 'border-warm-gray'
              }`}
            >
              <h3 className="text-lg font-semibold text-charcoal">{article.title}</h3>
              <div className="prose prose-sm mt-4 max-w-none text-charcoal/80">
                <ReactMarkdown>{article.content_md}</ReactMarkdown>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
