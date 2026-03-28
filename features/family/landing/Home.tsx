import React, { Suspense, lazy, useRef, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  BadgeCheck,
  Search,
  ArrowRight,
  DollarSign,
  PhoneOff,
  Building2,
  CheckCircle,
} from 'lucide-react';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { ALL_STATES } from '@/src/data/states';
const FamilyDashboardProof = lazy(() =>
  import('@/features/family/landing/FamilyDashboardProof').then((mod) => ({ default: mod.FamilyDashboardProof })),
);

type LocationSuggestion =
  | { type: 'city'; label: string; city: string; state: string }
  | { type: 'zip'; label: string; zip: string; city: string; state: string }
  | { type: 'state'; label: string; state: string; stateSlug: string };

let locationSuggestionsModulePromise:
  | Promise<typeof import('@/src/utils/locationSuggestions')>
  | null = null;

const loadLocationSuggestionsModule = async () => {
  if (!locationSuggestionsModulePromise) {
    locationSuggestionsModulePromise = import('@/src/utils/locationSuggestions');
  }
  return locationSuggestionsModulePromise;
};

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { loading, getLocation } = useGeolocation();
  const lastSuggestionQueryRef = useRef('');

  // Store detected city but don't auto-fill — show placeholder until user clicks
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedLocation = location.trim();
    if (!trimmedLocation) {
      navigate('/search');
      return;
    }
    navigate(`/search?location=${encodeURIComponent(trimmedLocation)}`);
  };

  const handleLocationChange = async (value: string) => {
    setLocation(value);
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    lastSuggestionQueryRef.current = value;
    const { getLocationSuggestions } = await loadLocationSuggestionsModule();
    if (lastSuggestionQueryRef.current !== value) return;
    setSuggestions(getLocationSuggestions(value));
    setShowSuggestions(true);
  };

  const handleSuggestionSelect = (suggestion: LocationSuggestion) => {
    if (suggestion.type === 'city') {
      setLocation(`${suggestion.city}, ${suggestion.state}`);
    }
    if (suggestion.type === 'zip') {
      setLocation(suggestion.zip);
    }
    if (suggestion.type === 'state') {
      setLocation(suggestion.label);
    }
    setShowSuggestions(false);
  };

  const FEATURED_STATES = ALL_STATES.slice(0, 15);
  const deferredSectionStyle: React.CSSProperties = {
    contentVisibility: 'auto',
    containIntrinsicSize: '900px',
  };

  return (
    <div className="min-h-screen bg-warm-white text-charcoal">
      <Helmet>
        <title>SilverTech Directory | Senior Care & Living Guide</title>
        <meta name="description" content="Search a trusted senior living directory for assisted living and memory care communities. Compare licensed facilities and connect directly." />
        <meta name="keywords" content="senior living directory, assisted living directory, memory care directory, licensed senior living facilities, compare senior living communities" />
        <link rel="canonical" href="https://silvertechdirectory.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="SilverTech Directory | Senior Care & Living Guide" />
        <meta property="og:description" content="Search assisted living and memory care communities with verified directory data and direct contact information." />
        <meta property="og:url" content="https://silvertechdirectory.com/" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SilverTech Directory | Senior Care & Living Guide" />
        <meta name="twitter:description" content="Search assisted living and memory care communities with verified directory data and direct contact information." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      <main>
        {/* ── Section 1: Hero ── */}
        <section className="relative">
          <div className="h-[480px] sm:h-[560px] relative overflow-hidden">
            <picture>
              <source
                type="image/avif"
                srcSet="/images/hero_image-640w.avif 640w, /images/hero_image-960w.avif 960w, /images/hero_image.avif 1536w"
                sizes="100vw"
              />
              <source
                type="image/webp"
                srcSet="/images/hero_image-640w.webp 640w, /images/hero_image-960w.webp 960w, /images/hero_image.webp 1536w"
                sizes="100vw"
              />
              <img
                src="/images/hero_image.png"
                alt="Senior living community"
                width={1536}
                height={1024}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
              />
            </picture>
            <div className="absolute inset-0 bg-charcoal/50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-white leading-tight max-w-4xl">
                The Referral-Free Senior Living Directory
              </h1>
              <p className="mt-6 text-lg text-white/90 max-w-2xl">
                Unbiased information powered by public data and direct facility verification. No commissions, no call centers, no broker pressure.
              </p>
              <p className="mt-3 text-sm font-semibold text-white bg-charcoal/55 border border-white/25 rounded-full px-4 py-1.5">
                Data sources: CMS.gov and state regulatory agencies.
              </p>

              {/* Search bar */}
              <div className="mt-8 w-full max-w-3xl">
                <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center px-4 relative">
                    <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                    <input
                      aria-label="Search for senior living by city, state, or zip code"
                      className="w-full border-none focus:ring-0 focus:outline-none py-4 text-charcoal placeholder-slate-400 bg-transparent"
                      placeholder="Search by city, state, or zip code..."
                      value={location}
                      onChange={(e) => handleLocationChange(e.target.value)}
                      onFocus={() => {
                        if (location.trim()) setShowSuggestions(true);
                      }}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    />
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={loading}
                      className="text-slate-400 hover:text-slate-700 disabled:opacity-50 flex-shrink-0"
                      title="Use my location"
                      aria-label="Use my current location"
                    >
                      <MapPin className="w-5 h-5" />
                    </button>

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.type}-${suggestion.label}-${index}`}
                            className="w-full min-h-11 px-4 py-3 text-sm text-slate-700 hover:bg-warm-gray flex items-center justify-between"
                            onMouseDown={() => handleSuggestionSelect(suggestion)}
                          >
                            <span>{suggestion.label}</span>
                            <span className="text-sm text-slate-500 uppercase">
                              {suggestion.type === 'zip' ? 'ZIP' : suggestion.type === 'state' ? 'State' : 'City'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full md:w-auto min-h-11 bg-charcoal text-white px-10 py-4 rounded-xl font-bold hover:bg-black transition-all"
                    aria-label="Search directory"
                  >
                    Search Verified Listings
                  </button>
                </form>
                <div className="mt-3 text-center">
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center text-sm font-semibold text-white/95 hover:text-white underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-charcoal rounded"
                  >
                    How It Works
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-b border-slate-100" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6 py-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Step 1</p>
                <p className="text-sm font-semibold text-charcoal mt-1">Search verified listings</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Step 2</p>
                <p className="text-sm font-semibold text-charcoal mt-1">Compare care and pricing</p>
              </div>
              <div className="rounded-xl border border-slate-200 p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Step 3</p>
                <p className="text-sm font-semibold text-charcoal mt-1">Track decisions and move-in outcome</p>
              </div>
            </div>
            <Suspense fallback={<div className="h-40 rounded-xl border border-slate-200 bg-slate-50 animate-pulse" />}>
              <FamilyDashboardProof />
            </Suspense>
          </div>
        </section>

        {/* ── Section 2: The SilverTech Standard ── */}
        <section className="py-20 bg-warm-gray" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-center text-sm font-bold uppercase tracking-[0.3em] text-gold mb-12">
              The SilverTech Standard
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: DollarSign,
                  title: 'No Referral Fees',
                  desc: 'We never profit from your decision. Facilities pay subscriptions, not commissions.',
                },
                {
                  icon: PhoneOff,
                  title: 'No Call Center',
                  desc: 'We are a directory, not a brokerage. We never sell your phone number to sales teams.',
                },
                {
                  icon: Building2,
                  title: 'Direct Facility Listings',
                  desc: 'Connect directly with community administrators, bypassing middleman agents.',
                },
                {
                  icon: BadgeCheck,
                  title: 'Verified Info',
                  desc: 'Information is cross-referenced with state health departments and licensing bureaus.',
                },
              ].map((item) => (
                <div key={item.title} className="space-y-4">
                  <item.icon className="w-6 h-6 text-gold" />
                  <h3 className="font-bold text-lg">{item.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 4: Compare Section ── */}
        <section id="how-it-works" className="py-20 bg-white border-y border-slate-100" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal mb-4">How this directory works</h2>
            <p className="text-slate-600 max-w-2xl mb-10">
              A simple path for families and providers: search licensed communities, compare what matters, then connect directly.
            </p>
            <div className="grid md:grid-cols-3 gap-5 mb-10">
              {[
                {
                  step: '1',
                  title: 'Search by city or state',
                  desc: 'Browse assisted living and memory care options with verified listing data.',
                },
                {
                  step: '2',
                  title: 'Compare key details',
                  desc: 'Review pricing ranges, care types, and important factors side-by-side.',
                },
                {
                  step: '3',
                  title: 'Contact facilities directly',
                  desc: 'Reach communities without referral brokers or middleman call centers.',
                },
              ].map((item) => (
                <div key={item.step} className="border border-slate-200 rounded-xl p-6 bg-white">
                  <div className="w-8 h-8 rounded-full bg-gold text-charcoal font-bold flex items-center justify-center mb-4">
                    {item.step}
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{item.title}</h3>
                  <p className="text-sm text-slate-600">{item.desc}</p>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/about" className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-charcoal hover:border-gold transition-colors">
                About SilverTech
              </Link>
              <Link to="/methodology" className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-charcoal hover:border-gold transition-colors">
                View Methodology
              </Link>
              <Link to="/editorial-policy" className="inline-flex items-center px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-medium text-charcoal hover:border-gold transition-colors">
                Editorial Policy
              </Link>
            </div>
          </div>
        </section>

        <section className="py-24 border-y border-slate-100" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl font-serif font-bold mb-6">Compare side-by-side.</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Build your comparison from real listings. Save up to 3 communities while browsing to compare
                pricing, staffing, and key quality signals in one place.
              </p>
              <div className="space-y-4">
                {[
                  'Staffing ratios vs. State Average',
                  '3-Year Violation History',
                  'Dining and Lifestyle Amenities',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-gold flex-shrink-0" />
                    <span className="text-sm font-semibold">{item}</span>
                  </div>
                ))}
              </div>
              <button
                onClick={() => navigate('/search')}
                className="mt-10 px-8 py-3 border-2 border-charcoal text-charcoal font-bold rounded-lg hover:bg-charcoal hover:text-white transition-all"
              >
                Start Comparing Listings
              </button>
            </div>
            <div className="flex-1 w-full">
              <div className="sm:hidden space-y-3">
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-charcoal">Monthly Cost</p>
                  <p className="text-sm text-slate-600 mt-1">Compare estimated all-in monthly pricing across communities.</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-charcoal">Staffing and Safety</p>
                  <p className="text-sm text-slate-600 mt-1">Review staffing ratios and recent inspection history side by side.</p>
                </div>
                <div className="bg-white rounded-xl border border-slate-200 p-4">
                  <p className="text-sm font-semibold text-charcoal">Amenities and Fit</p>
                  <p className="text-sm text-slate-600 mt-1">Evaluate lifestyle features and care options before touring.</p>
                </div>
              </div>
              <div className="hidden sm:block bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-slate-500 border border-slate-200">
                    silvertechdirectory.com/search
                  </div>
                </div>
                {/* Comparison tool mockup */}
                <div className="p-5">
                  {/* Header row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-xs font-bold uppercase tracking-widest text-slate-500 pt-2">Metrics</div>
                    {['Sunrise Manor', 'Oakwood Gardens', 'Harbor View'].map((name) => (
                      <div key={name} className="bg-warm-gray rounded-lg p-3 text-center">
                        <div className="w-8 h-8 bg-slate-200 rounded-full mx-auto mb-2" />
                        <p className="text-sm font-bold text-charcoal leading-tight">{name}</p>
                        <p className="text-xs text-slate-500 mt-0.5">Indianapolis, IN</p>
                      </div>
                    ))}
                  </div>
                  {/* Data rows */}
                  {[
                    { label: 'Monthly Cost', values: ['$4,200', '$3,850', '$5,100'] },
                    { label: 'Staff Ratio', values: ['1:6', '1:8', '1:5'] },
                    { label: 'Violations (3yr)', values: ['2', '5', '0'] },
                    { label: 'Overall Score', values: ['92', '78', '96'], highlight: true },
                  ].map((row) => (
                    <div key={row.label} className={`grid grid-cols-4 gap-3 py-2.5 border-t border-slate-100 ${row.highlight ? 'bg-warm-gray/50 -mx-5 px-5' : ''}`}>
                      <div className="text-sm font-semibold text-slate-600">{row.label}</div>
                      {row.values.map((val, i) => (
                        <div key={i} className="text-center">
                          <span className={`text-[12px] font-bold ${row.highlight ? 'text-gold' : 'text-charcoal'}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* CTA row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs text-slate-500">Comparing 3 of 3 communities</span>
                    <div className="bg-charcoal text-white text-xs font-bold px-4 py-1.5 rounded-md">
                      View Full Report
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Research & Decision Support ── */}
        <section className="py-20 bg-warm-white" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-serif font-bold mb-10">Research &amp; Decision Support</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'How to choose',
                  desc: 'A step-by-step framework for evaluating care levels and community culture.',
                  cta: 'Read Guide',
                  href: '/guides/how-to-choose',
                },
                {
                  title: 'What it costs',
                  desc: 'Understanding community fees, care tiers, and financial assistance programs.',
                  cta: 'View Pricing',
                  href: '/guides/what-it-costs',
                },
                {
                  title: 'Tour questions',
                  desc: 'Printable checklist of critical questions to ask during your facility tour.',
                  cta: 'Get Checklist',
                  href: '/guides/tour-questions',
                },
              ].map((card) => (
                <Link
                  key={card.title}
                  to={card.href}
                  className="p-8 bg-white border border-slate-200 rounded-xl hover:shadow-lg transition-shadow"
                >
                  <h3 className="font-bold text-xl mb-3">{card.title}</h3>
                  <p className="text-sm text-slate-500 mb-4">{card.desc}</p>
                  <span className="text-gold font-bold text-sm inline-flex items-center gap-1">
                    {card.cta} <ArrowRight className="w-4 h-4" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 6: Trust Standard / Browse by State ── */}
        <section className="py-20 bg-slate-900 text-white" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h2 className="text-3xl font-serif font-bold mb-4">The SilverTech Trust Standard</h2>
                <p className="text-slate-400">
                  A commission-free directory built on verified data and direct-to-family access.
                </p>
              </div>
              <div className="flex gap-3">
                {['CA', 'FL', 'TX', 'NY'].map((st) => {
                  const state = ALL_STATES.find((s) => s.abbreviation === st);
                  const href = state ? `/states/${state.slug}` : '/states';
                  return (
                  <Link
                    key={st}
                    to={href}
                    className="bg-white/10 px-3 py-1.5 rounded text-sm font-bold hover:text-gold transition-colors"
                  >
                    {st}
                  </Link>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-white/10 pt-8">
              <Link
                to="/states"
                className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-gold transition-colors"
              >
                Browse all states
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Section 7: Browse by State (quick links) ── */}
        <section className="py-20 bg-warm-white" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-serif font-bold mb-10">Browse by State</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {FEATURED_STATES.map((state) => (
                <Link
                  key={state.abbreviation}
                  to={`/states/${state.slug}`}
                  className="text-sm font-medium py-3 px-4 min-h-11 bg-white border border-slate-100 rounded hover:border-gold transition-colors flex items-center"
                >
                  {state.name}
                </Link>
              ))}
              <Link
                to="/states"
                className="text-sm font-medium py-3 px-4 min-h-11 bg-slate-100 text-slate-500 rounded text-center hover:bg-slate-200 transition-colors flex items-center justify-center"
              >
                View All 50
              </Link>
            </div>
          </div>
        </section>

        {/* ── Section 8: Verification Methodology ── */}
        <section className="py-24 bg-warm-gray" style={deferredSectionStyle}>
          <div className="max-w-[1200px] mx-auto px-6 text-center">
            <h2 className="text-3xl font-serif font-bold mb-6">Our Verification Methodology</h2>
            <p className="text-slate-600 max-w-3xl mx-auto mb-16 leading-relaxed">
              SilverTech maintains a proprietary dataset audited monthly. Every community listed must pass
              our data integrity threshold, including confirmation of licensing status, ownership history,
              and health inspection availability.
            </p>
            <div className="flex flex-wrap justify-center gap-12">
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 mb-4 border-2 border-gold rounded-full flex flex-col items-center justify-center text-gold">
                  <ShieldCheck className="w-10 h-10" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Accuracy Badge</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 mb-4 border-2 border-gold rounded-full flex flex-col items-center justify-center text-gold">
                  <BadgeCheck className="w-10 h-10" />
                </div>
                <span className="text-sm font-bold uppercase tracking-widest">Integrity Badge</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-20" style={deferredSectionStyle}>
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
            <div>
              <div className="mb-6">
                <img src="/logo.png" alt="SilverTech Directory" width={256} height={256} className="h-8 w-auto" loading="lazy" decoding="async" />
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                The commission-free senior care directory focused on trust and data integrity. Built for families, by researchers.
              </p>
            </div>
            <div>
              <h3 className="font-bold text-sm uppercase tracking-widest mb-6">Search</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link to="/states" className="hover:text-gold">Browse by State</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-500">
              &copy; {new Date().getFullYear()} SilverTech Directory. All rights reserved.
            </p>
            <div className="flex gap-6 text-sm text-slate-500">
              <Link to="/why-this-exists" className="hover:text-gold">Why This Exists</Link>
              <Link to="/editorial-policy" className="hover:text-gold">Editorial Policy</Link>
              <Link to="/honest-care" className="hover:text-gold">Honest Care</Link>
              <a href="mailto:andrew@silvertechdirectory.com" className="hover:text-gold">Email</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-center items-center z-50 md:hidden">
        <button onClick={() => navigate('/states')} className="flex flex-col items-center text-gold">
          <Search className="w-5 h-5" />
          <span className="text-xs font-semibold uppercase tracking-widest mt-1">States</span>
        </button>
      </nav>
    </div>
  );
};
