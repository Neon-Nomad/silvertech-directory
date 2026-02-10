import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  Menu,
  MapPin,
  ShieldCheck,
  BadgeCheck,
  FileText,
  ChevronRight,
  Search,
  Heart,
  Calendar,
  User
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { getLocationSuggestions, LocationSuggestion } from '@/src/utils/locationSuggestions';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const [careType, setCareType] = useState('Assisted Living');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { loading, nearestCity, getLocation } = useGeolocation();

  React.useEffect(() => {
    if (nearestCity) {
      setLocation(nearestCity);
    }
  }, [nearestCity]);

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

  return (
    <div className="min-h-screen bg-[#f8f4ef] text-slate-900">
      <Helmet>
        <title>SilverTech Directory | Commission-Free Senior Living</title>
        <meta name="description" content="Find trusted memory care and assisted living communities with transparent, commission-free listings. Compare facilities and connect directly." />
        <link rel="canonical" href="https://silvertechdirectory.com/" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content="SilverTech Directory | Commission-Free Senior Living" />
        <meta property="og:description" content="Find trusted memory care and assisted living communities with transparent, commission-free listings. Compare facilities and connect directly." />
        <meta property="og:url" content="https://silvertechdirectory.com/" />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SilverTech Directory | Commission-Free Senior Living" />
        <meta name="twitter:description" content="Find trusted memory care and assisted living communities with transparent, commission-free listings. Compare facilities and connect directly." />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      <header className="bg-[#f8f4ef]/95 backdrop-blur-sm px-6 py-5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center">
            <Compass className="w-4 h-4 text-primary-600" />
          </div>
          <span className="text-lg font-semibold tracking-tight">SilverTech</span>
        </div>
        <button className="p-2 text-slate-700 hover:text-slate-900" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      <main className="max-w-6xl mx-auto">
        <section className="relative">
          <div className="h-[420px] sm:h-[520px] relative overflow-hidden">
            <img
              src="/images/hero_image.jpeg"
              alt="Senior living community"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/25" />
            <div className="absolute inset-0 flex flex-col justify-end p-8 pb-24">
              <h1 className="text-4xl sm:text-5xl text-white font-serif font-semibold leading-tight">
                Navigate Senior Living with Confidence
              </h1>
            </div>
          </div>

          <div className="px-6 -mt-14 relative z-10">
            <div className="bg-white p-6 shadow-xl border border-slate-200 rounded-lg">
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-semibold text-slate-400 absolute top-2 left-3">
                    Location
                  </label>
                  <input
                    className="w-full pt-6 pb-2 px-3 border-b border-slate-200 text-sm focus:outline-none focus:border-primary-500 bg-transparent"
                    placeholder="City or Zip Code"
                    value={location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    onFocus={() => location.trim() && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  <button
                    type="button"
                    onClick={getLocation}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 disabled:opacity-50"
                    title="Use my location"
                  >
                    <MapPin className="w-4 h-4" />
                  </button>
                  {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg text-left">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.type}-${suggestion.label}-${index}`}
                          className="w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center justify-between"
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

                <div className="relative">
                  <label className="text-[10px] uppercase tracking-[0.3em] font-semibold text-slate-400 absolute top-2 left-3">
                    Care Type
                  </label>
                  <select
                    className="w-full pt-6 pb-2 px-3 border-b border-slate-200 text-sm focus:outline-none focus:border-primary-500 bg-transparent appearance-none"
                    value={careType}
                    onChange={(e) => setCareType(e.target.value)}
                  >
                    <option>Assisted Living</option>
                    <option>Memory Care</option>
                    <option>Independent Living</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full bg-primary-500 text-white py-4 rounded-md font-semibold uppercase tracking-widest text-xs shadow-lg hover:bg-primary-600 transition-colors"
                >
                  Find Care Near Me
                </button>
              </form>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 space-y-12">
          <div className="text-center">
            <span className="text-[10px] uppercase tracking-[0.3em] font-semibold text-primary-600 mb-2 block">Our Commitment</span>
            <h2 className="text-2xl font-serif font-semibold">Trust Built on Transparency</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4">
                <ShieldCheck className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-2">No Referral Fees</h3>
              <p className="text-sm text-slate-600 leading-relaxed px-4">
                Our recommendations are unbiased. We never accept payment for placement.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4">
                <BadgeCheck className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-2">Verified Pricing</h3>
              <p className="text-sm text-slate-600 leading-relaxed px-4">
                Direct-from-source cost data updated monthly to prevent hidden surprises.
              </p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-slate-200 mb-4">
                <FileText className="w-7 h-7 text-primary-600" />
              </div>
              <h3 className="font-serif font-semibold text-lg mb-2">Official Inspection Reports</h3>
              <p className="text-sm text-slate-600 leading-relaxed px-4">
                Direct access to state health surveys and safety violation records.
              </p>
            </div>
          </div>
        </section>

        <section className="px-6 py-16 bg-white/60">
          <h2 className="text-2xl font-serif font-semibold mb-8">Browse by Care Type</h2>
          <div className="space-y-4">
            {[
              { title: 'Assisted Living', count: '42 Facilities Available', image: '/images/hero_image.jpeg' },
              { title: 'Memory Care', count: '18 Specialized Centers', image: '/hero.png' },
              { title: 'Independent Living', count: '24 Active Communities', image: '/images/hero_image.jpeg' }
            ].map((item) => (
              <button
                key={item.title}
                className="w-full bg-white border border-slate-200 p-1 flex items-center shadow-sm hover:shadow-md transition-shadow"
                onClick={() => navigate('/search')}
              >
                <div className="w-24 h-24 flex-shrink-0">
                  <img className="w-full h-full object-cover" src={item.image} alt={item.title} />
                </div>
                <div className="px-4 py-2 flex-1 text-left">
                  <h4 className="font-serif font-semibold text-slate-900">{item.title}</h4>
                  <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">{item.count}</p>
                </div>
                <div className="pr-4">
                  <ChevronRight className="text-primary-500" />
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <footer className="bg-slate-900 text-white px-8 py-16 mt-12">
        <div className="max-w-6xl mx-auto">
          <div className="mb-12">
            <h2 className="text-2xl font-serif font-semibold mb-6">Transparency Pledge</h2>
            <p className="text-sm text-slate-300 leading-relaxed mb-8">
              At SilverTech, our data methodology is simple: truth first. We aggregate data from the CMS, State Departments of Health,
              and direct on-site verifications.
            </p>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <span className="text-primary-400 text-sm">●</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-200">Data Source</p>
                  <p className="text-xs text-slate-400">Medicare.gov / CMS Data Archives 2024</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-primary-400 text-sm">●</span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-slate-200">Verification</p>
                  <p className="text-xs text-slate-400">Quarterly Independent Audits</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-white/10 text-center">
            <div className="flex items-center justify-center space-x-2 mb-4 opacity-70">
              <Compass className="text-primary-400 w-4 h-4" />
              <span className="text-lg font-semibold">SilverTech</span>
            </div>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest">© 2026 SilverTech Trust. All Rights Reserved.</p>
          </div>
        </div>
      </footer>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-6 py-3 flex justify-between items-center z-50 md:hidden">
        <button className="flex flex-col items-center text-primary-600">
          <Search className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Search</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <Heart className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Saved</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <Calendar className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Tours</span>
        </button>
        <button className="flex flex-col items-center text-slate-400">
          <User className="w-5 h-5" />
          <span className="text-[9px] font-semibold uppercase tracking-widest mt-1">Account</span>
        </button>
      </nav>
    </div>
  );
};
