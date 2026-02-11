import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  ShieldCheck,
  BadgeCheck,
  Search,
  Heart,
  ArrowRight,
  DollarSign,
  PhoneOff,
  Building2,
  CheckCircle,
  Users,
  User,
  GitCompareArrows,
} from 'lucide-react';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { getLocationSuggestions, LocationSuggestion } from '@/src/utils/locationSuggestions';
import { ALL_STATES } from '@/src/data/states';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { loading, getLocation } = useGeolocation();

  // Store detected city but don't auto-fill — show placeholder until user clicks
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(location)}`);
  };

  const handleLocationChange = (value: string) => {
    setLocation(value);
    if (value.trim().length > 0) {
      setSuggestions(getLocationSuggestions(value));
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
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

  return (
    <div className="min-h-screen bg-warm-white text-charcoal">
      <Helmet>
        <title>SilverTech Directory | Commission-Free Senior Living</title>
        <meta name="description" content="Find trusted memory care and assisted living communities with transparent, commission-free listings. Compare facilities and connect directly." />
        <link rel="canonical" href="https://silvertechdirectory.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="SilverTech Directory | Commission-Free Senior Living" />
        <meta property="og:description" content="Find trusted memory care and assisted living communities with transparent, commission-free listings." />
        <meta property="og:url" content="https://silvertechdirectory.com/" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SilverTech Directory | Commission-Free Senior Living" />
        <meta name="twitter:description" content="Find trusted memory care and assisted living communities with transparent, commission-free listings." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      <main>
        {/* ── Section 1: Hero ── */}
        <section className="relative">
          <div className="h-[480px] sm:h-[560px] relative overflow-hidden">
            <img
              src="/images/hero_image.png"
              alt="Senior living community"
              className="w-full h-full object-cover"
              loading="eager"
              decoding="async"
              fetchpriority="high"
            />
            <div className="absolute inset-0 bg-charcoal/50" />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-extrabold text-white leading-tight max-w-4xl">
                Find senior living communities with{' '}
                <span className="underline decoration-gold decoration-2 underline-offset-8">clear pricing</span>{' '}
                and verified information.
              </h1>
              <p className="mt-6 text-lg text-white/90 max-w-2xl">
                Compare communities, understand costs, and make decisions with confidence. No marketing calls, no hidden fees.
              </p>

              {/* Search bar */}
              <div className="mt-8 w-full max-w-3xl">
                <form onSubmit={handleSearch} className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100 flex flex-col md:flex-row items-center gap-2">
                  <div className="flex-1 w-full flex items-center px-4 relative">
                    <Search className="w-5 h-5 text-slate-400 mr-3 flex-shrink-0" />
                    <input
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
                    >
                      <MapPin className="w-5 h-5" />
                    </button>

                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-10 w-full top-full left-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg">
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={`${suggestion.type}-${suggestion.label}-${index}`}
                            className="w-full px-4 py-2.5 text-sm text-slate-700 hover:bg-warm-gray flex items-center justify-between"
                            onMouseDown={() => handleSuggestionSelect(suggestion)}
                          >
                            <span>{suggestion.label}</span>
                            <span className="text-xs text-slate-400 uppercase">
                              {suggestion.type === 'zip' ? 'ZIP' : suggestion.type === 'state' ? 'State' : 'City'}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full md:w-auto bg-charcoal text-white px-10 py-4 rounded-xl font-bold hover:bg-black transition-all"
                  >
                    Search
                  </button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Care Type Grid ── */}
        <section className="py-14 bg-warm-white">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Assisted Living', icon: Building2, slug: 'assisted-living' },
                { title: 'Memory Care', icon: Users, slug: 'memory-care' },
                { title: 'Independent Living', icon: Heart, slug: 'independent-living' },
                { title: 'Nursing Homes', icon: ShieldCheck, slug: 'nursing-homes' },
              ].map((type) => (
                <button
                  key={type.title}
                  onClick={() => navigate(`/search?type=${type.slug}`)}
                  className="bg-white p-6 rounded-xl border border-slate-200 hover:border-gold transition-all text-center group"
                >
                  <type.icon className="w-8 h-8 text-gold mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <span className="font-bold text-xs uppercase tracking-widest">{type.title}</span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 3: The SilverTech Standard ── */}
        <section className="py-20 bg-warm-gray">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-center text-xs font-bold uppercase tracking-[0.3em] text-gold mb-12">
              The SilverTech Standard
            </h2>
            <div className="grid md:grid-cols-4 gap-8">
              {[
                {
                  icon: DollarSign,
                  title: 'Price Transparency',
                  desc: 'View real base rates and care tier costs before you ever pick up the phone.',
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
                  desc: 'Information cross-referenced with state health departments and licensing bureaus.',
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
        <section className="py-24 border-y border-slate-100">
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-3xl font-serif font-bold mb-6">Compare side-by-side.</h2>
              <p className="text-slate-600 mb-8 leading-relaxed">
                Our comparison tool allows you to compare up to 3 communities across 40+ data points,
                including safety violations, staffing ratios, and all-inclusive cost projections.
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
                Try Comparison Tool
              </button>
            </div>
            <div className="flex-1 w-full">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-slate-50 p-3 border-b border-slate-100 flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                  </div>
                  <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-[10px] text-slate-400 border border-slate-200">
                    silvertechdirectory.com/compare
                  </div>
                </div>
                {/* Comparison tool mockup */}
                <div className="p-5">
                  {/* Header row */}
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pt-2">Metrics</div>
                    {['Sunrise Manor', 'Oakwood Gardens', 'Harbor View'].map((name) => (
                      <div key={name} className="bg-warm-gray rounded-lg p-3 text-center">
                        <div className="w-8 h-8 bg-slate-200 rounded-full mx-auto mb-2" />
                        <p className="text-[11px] font-bold text-charcoal leading-tight">{name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Indianapolis, IN</p>
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
                      <div className="text-[11px] font-semibold text-slate-500">{row.label}</div>
                      {row.values.map((val, i) => (
                        <div key={i} className="text-center">
                          <span className={`text-[12px] font-bold ${row.highlight ? 'text-gold' : 'text-charcoal'}`}>{val}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                  {/* CTA row */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-[10px] text-slate-400">Comparing 3 of 3 communities</span>
                    <div className="bg-charcoal text-white text-[10px] font-bold px-4 py-1.5 rounded-md">
                      View Full Report
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 5: Research & Decision Support ── */}
        <section className="py-20 bg-warm-white">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-serif font-bold mb-10">Research &amp; Decision Support</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: 'How to choose',
                  desc: 'A step-by-step framework for evaluating care levels and community culture.',
                  cta: 'Read Guide',
                  href: '/resources/guides',
                },
                {
                  title: 'What it costs',
                  desc: 'Understanding community fees, care tiers, and financial assistance programs.',
                  cta: 'View Pricing',
                  href: '/resources/guides',
                },
                {
                  title: 'Tour questions',
                  desc: 'Printable checklist of critical questions to ask during your facility tour.',
                  cta: 'Get Checklist',
                  href: '/resources/guides',
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

        {/* ── Section 6: Cost Transparency / Browse by State ── */}
        <section className="py-20 bg-slate-900 text-white">
          <div className="max-w-[1200px] mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h2 className="text-3xl font-serif font-bold mb-4">Cost Transparency Index</h2>
                <p className="text-slate-400">
                  Current national average for Assisted Living:{' '}
                  <span className="text-white font-bold">$4,500/mo</span>
                </p>
              </div>
              <div className="flex gap-3">
                {['CA', 'FL', 'TX', 'NY'].map((st) => (
                  <Link
                    key={st}
                    to={`/states/${st.toLowerCase()}`}
                    className="bg-white/10 px-3 py-1.5 rounded text-sm font-bold hover:text-gold transition-colors"
                  >
                    {st}
                  </Link>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-4 text-sm text-slate-400 border-t border-white/10 pt-10">
              {ALL_STATES.map((state) => (
                <Link
                  key={state.abbreviation}
                  to={`/states/${state.slug}`}
                  className="hover:text-gold transition-colors"
                >
                  {state.name}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── Section 7: Browse by State (quick links) ── */}
        <section className="py-20 bg-warm-white">
          <div className="max-w-[1200px] mx-auto px-6">
            <h2 className="text-2xl font-serif font-bold mb-10">Browse by State</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {FEATURED_STATES.map((state) => (
                <Link
                  key={state.abbreviation}
                  to={`/states/${state.slug}`}
                  className="text-sm font-medium py-2 px-4 bg-white border border-slate-100 rounded hover:border-gold transition-colors"
                >
                  {state.name}
                </Link>
              ))}
              <Link
                to="/states"
                className="text-sm font-medium py-2 px-4 bg-slate-100 text-slate-500 rounded text-center hover:bg-slate-200 transition-colors"
              >
                View All 50
              </Link>
            </div>
          </div>
        </section>

        {/* ── Section 8: Verification Methodology ── */}
        <section className="py-24 bg-warm-gray">
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
                <span className="text-xs font-bold uppercase tracking-widest">Accuracy Badge</span>
              </div>
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 mb-4 border-2 border-gold rounded-full flex flex-col items-center justify-center text-gold">
                  <BadgeCheck className="w-10 h-10" />
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Pricing Badge</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="bg-white border-t border-slate-200 py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
            <div>
              <div className="mb-6">
                <img src="/images/logo2.png" alt="SilverTech Directory" className="h-8 w-auto" />
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                The commission-free senior care directory focused on trust and data integrity. Built for families, by researchers.
              </p>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-6">Explore</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link to="/search?type=assisted-living" className="hover:text-gold">Assisted Living</Link></li>
                <li><Link to="/search?type=memory-care" className="hover:text-gold">Memory Care</Link></li>
                <li><Link to="/search?type=independent-living" className="hover:text-gold">Independent Living</Link></li>
                <li><Link to="/states" className="hover:text-gold">Browse by State</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-6">Support</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link to="/resources/guides" className="hover:text-gold">How to Choose</Link></li>
                <li><Link to="/faq" className="hover:text-gold">FAQ</Link></li>
                <li><Link to="/methodology" className="hover:text-gold">Methodology</Link></li>
                <li><Link to="/contact" className="hover:text-gold">Contact Us</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-widest mb-6">Company</h4>
              <ul className="space-y-3 text-sm text-slate-600">
                <li><Link to="/about" className="hover:text-gold">About</Link></li>
                <li><Link to="/blog" className="hover:text-gold">Blog</Link></li>
                <li><Link to="/for-facilities" className="hover:text-gold">For Facilities</Link></li>
                <li><Link to="/pricing" className="hover:text-gold">Pricing Plans</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-400">
              &copy; {new Date().getFullYear()} SilverTech Directory. All rights reserved.
            </p>
            <div className="flex gap-6 text-xs text-slate-400">
              <Link to="/editorial-policy" className="hover:text-gold">Editorial Policy</Link>
              <Link to="/honest-care" className="hover:text-gold">Honest Care</Link>
              <a href="mailto:andrew@silvertechdirectory.com" className="hover:text-gold">Email</a>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Mobile Bottom Bar ── */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 md:hidden">
        <button onClick={() => navigate('/search')} className="flex flex-col items-center text-gold">
          <Search className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Search</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <Heart className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Saved</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <GitCompareArrows className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Compare</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <User className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Account</span>
        </button>
      </nav>
    </div>
  );
};
