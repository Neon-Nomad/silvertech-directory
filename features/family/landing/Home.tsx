import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { MapPin, ArrowRight, Loader2, Crosshair } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useGeolocation } from '@/src/hooks/useGeolocation';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const [location, setLocation] = useState('');
  const { loading, error, nearestCity, getLocation } = useGeolocation();

  React.useEffect(() => {
    if (nearestCity) {
      setLocation(nearestCity);
    }
  }, [nearestCity]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/search?location=${encodeURIComponent(location)}`);
  };

  return (
    <div className="min-h-screen bg-[#f6f1ea] flex flex-col">
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
      <main className="flex-1 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto pt-10 pb-16">
          <div className="relative rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-white">
            <img
              src="/images/hero_image.jpeg"
              alt="Senior living community interior"
              className="w-full h-[360px] md:h-[440px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent" />
            <div className="absolute top-5 left-5 bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 border border-slate-200 shadow-sm">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">SilverTech Directory</p>
            </div>
            <div className="absolute left-1/2 bottom-6 transform -translate-x-1/2 w-[92%] max-w-3xl">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-slate-200 shadow-lg p-4 md:p-5">
                <p className="text-lg md:text-xl font-semibold text-slate-900 text-center mb-4">
                  Find trusted senior living communities
                </p>
                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1 relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="City, State, or ZIP" 
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-12 pr-12 py-4 bg-[#f6f1ea] border border-transparent focus:bg-white focus:border-primary-500 rounded-xl text-lg outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={getLocation}
                      disabled={loading}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                      title="Use my location"
                    >
                      {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Crosshair className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                  <Button type="submit" size="lg" className="px-8 text-lg h-auto py-4">
                    Search Directory
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl w-full mx-auto space-y-12 text-center pb-16">
          
          <div className="space-y-6">
            <div className="inline-flex items-center space-x-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-slate-200 mb-4">
              <span className="text-xs font-bold bg-primary-600 text-white px-2 py-0.5 rounded-full">New</span>
              <span className="text-sm text-slate-600 font-medium">Commission-Free Senior Living</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 leading-tight">
              Find Trusted Memory Care <br className="hidden md:block" />
              <span className="text-slate-500">for Your Loved One.</span>
            </h1>
            
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Connect directly with verified communities. No hidden fees, no middleman, just the care they deserve.
            </p>
            
            <div className="pt-2">
              <span onClick={() => navigate('/honest-care')} className="text-primary-600 hover:text-primary-700 font-medium cursor-pointer underline decoration-primary-300 hover:decoration-primary-600 underline-offset-4 transition-all">
                Learn how "free" referral services really work
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <span className="text-slate-400 font-medium uppercase text-sm tracking-wider">or</span>
          </div>

          <div>
            <Button 
              variant="outline" 
              size="lg" 
              className="group text-lg px-8 py-6 h-auto border-2 hover:border-primary-600 hover:text-primary-600"
              onClick={() => navigate('/survey')}
            >
              Not Sure? Start CareFinder Survey
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <p className="mt-3 text-sm text-slate-500">
              Take a deep breath; we'll handle the data.
            </p>
          </div>

        </div>
      </main>
      
      {/* Footer / Trust Indicators */}
      <div className="py-8 border-t border-slate-200 bg-white/70">
        <div className="max-w-7xl mx-auto px-4 flex justify-center gap-8 md:gap-16 grayscale opacity-60">
           <div className="flex items-center gap-2 font-semibold text-slate-900">
             <div className="w-2 h-2 bg-green-500 rounded-full"></div> Real-Time Availability
           </div>
           <div className="flex items-center gap-2 font-semibold text-slate-900">
             <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Zero Commissions
           </div>
           <div className="flex items-center gap-2 font-semibold text-slate-900">
             <div className="w-2 h-2 bg-purple-500 rounded-full"></div> Verified Data
           </div>
        </div>
      </div>
    </div>
  );
};
