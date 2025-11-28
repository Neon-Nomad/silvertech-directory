import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Building2, ChevronRight, Shield, Phone, AlertTriangle } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { supabase } from '@/src/lib/supabase';
import { useJsonLd } from '@/src/hooks/useJsonLd';
import { ALL_STATES as states } from '@/src/data/states';
import { rankFacilities } from '@/src/utils/ranking';
import { BestFacilitiesList } from './BestFacilitiesList';

// Helper to format strings (e.g., "san-francisco" -> "San Francisco")
const formatName = (slug: string) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const CityPageTemplate: React.FC = () => {
  const { state: stateSlug, city: citySlug } = useParams<{ state: string; city: string }>();
  
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Derived state
  const cityName = citySlug ? formatName(citySlug) : '';
  const stateData = states.find(s => s.slug === stateSlug?.toLowerCase());
  const stateName = stateData ? stateData.name : formatName(stateSlug || '');
  const stateAbbr = stateData ? stateData.abbreviation : stateSlug?.toUpperCase();

  useEffect(() => {
    const fetchFacilities = async () => {
      if (!stateSlug || !citySlug) return;

      setLoading(true);
      try {
        // 1. Get facilities for the state
        // We use the state abbreviation if we have it, otherwise the slug (less reliable if DB uses abbr)
        // Ideally we should have a reliable way to get state abbr from slug. 
        // We have `states` data now.
        
        const targetState = stateData?.abbreviation || stateSlug;
        const targetCity = cityName; // DB usually has "San Francisco" not "san-francisco"

        const { data, error } = await supabase
          .from('facilities')
          .select('*')
          .ilike('state', targetState)
          .ilike('city', targetCity)
          .order('name', { ascending: true });

        if (error) throw error;

        setFacilities(data || []);
      } catch (err) {
        console.error('Error fetching city facilities:', err);
        setError('Failed to load facilities.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [stateSlug, citySlug, cityName, stateData]);

  // SEO & Schema
  const pageTitle = `Assisted Living in ${cityName}, ${stateAbbr} — Directory of Senior Care Facilities`;
  const pageDescription = `See the Top 10 Best Assisted Living Facilities in ${cityName}, ${stateName}. Compare prices, read reviews, and find verified senior care providers.`;
  const canonicalUrl = `https://silvertech.com/assisted-living/${stateSlug}/cities/${citySlug}`; // Update domain as needed

  // Use ranked facilities for Schema to highlight best ones first
  const rankedFacilities = rankFacilities(facilities);

  // JSON-LD ItemList
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: rankedFacilities.map((f, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'LocalBusiness',
        name: f.name,
        address: {
          '@type': 'PostalAddress',
          streetAddress: f.address_line1,
          addressLocality: f.city,
          addressRegion: f.state,
          postalCode: f.postal_code,
          addressCountry: 'US'
        },
        telephone: f.phone,
        url: `https://silvertech.com/facility/${f.id}`,
        ...(f.image ? { image: f.image } : {}),
        ...(f.price ? { priceRange: f.price } : {})
      }
    }))
  };

  useJsonLd(itemListSchema);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      {/* Breadcrumbs */}
      <div className="bg-white shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={[
            { label: 'Home', path: '/' },
            { label: 'States', path: '/assisted-living' }, // Assuming there's a states index or redirect
            { label: stateName, path: `/assisted-living/${stateSlug}` },
            { label: cityName }
          ]} />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
            {cityName}, {stateAbbr} Assisted Living & Memory Care Directory
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl leading-relaxed">
            We found <strong>{facilities.length}</strong> senior care providers in {cityName}. 
            At SilverTech, we believe in transparency. We don't take commissions from these facilities, 
            so you can trust our data is unbiased and family-first.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content: Facility List */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Honest Care Callout */}
            <div className="bg-primary-50 border border-primary-100 rounded-lg p-6 flex items-start gap-4">
              <Shield className="w-8 h-8 text-primary-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="font-bold text-lg text-primary-900 mb-1">Honest, Unbiased Information</h3>
                <p className="text-primary-800 mb-2">
                  Most other directories charge hidden referral fees that influence which facilities they show you. 
                  We don't.
                </p>
                <Link to="/honest-care" className="text-primary-700 font-medium underline hover:text-primary-900">
                  Read our Transparency Pledge
                </Link>
              </div>
            </div>

            {/* Best Facilities Ranking */}
            {!loading && !error && facilities.length > 0 && citySlug && (
              <BestFacilitiesList 
                facilities={rankedFacilities} 
                cityName={cityName} 
              />
            )}

            {loading ? (
              <div className="py-12 text-center text-slate-500">Loading facilities in {cityName}...</div>
            ) : error ? (
               <div className="py-12 text-center text-red-500">Error: {error}</div>
            ) : facilities.length === 0 ? (
              <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 text-center">
                <h3 className="text-xl font-bold text-slate-900 mb-2">No facilities found in {cityName} yet.</h3>
                <p className="text-slate-600 mb-6">
                  We are constantly updating our directory. Try searching for a nearby city or browse the state page.
                </p>
                <Link 
                  to={`/assisted-living/${stateSlug}`}
                  className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                >
                  Browse {stateName}
                </Link>
              </div>
            ) : (
              <div className="space-y-6">
                {facilities.map((facility) => (
                  <div key={facility.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 mb-2">
                          <Link to={`/facility/${facility.id}`} className="hover:text-primary-600 transition-colors">
                            {facility.name}
                          </Link>
                        </h3>
                        
                        <div className="flex items-start text-slate-600 mb-2">
                          <MapPin size={18} className="mr-2 mt-1 text-slate-400 flex-shrink-0" />
                          <span>
                            {facility.address_line1}<br/>
                            {facility.city}, {facility.state} {facility.postal_code}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-slate-600 mb-3">
                          <Building2 size={18} className="mr-2 text-slate-400" />
                          <span>{facility.type || 'Assisted Living'}</span>
                        </div>

                        {facility.phone && (
                          <div className="flex items-center text-slate-600">
                            <Phone size={18} className="mr-2 text-slate-400" />
                            <span>{facility.phone}</span>
                          </div>
                        )}
                      </div>

                      <div className="w-full md:w-auto flex flex-col items-end gap-4">
                         {/* Price Placeholder - Future Feature */}
                         {facility.price && (
                             <div className="text-right">
                                <div className="text-lg font-bold text-primary-600">{facility.price}</div>
                                <div className="text-sm text-slate-500">per month</div>
                             </div>
                         )}
                         
                         <Link 
                            to={`/facility/${facility.id}`}
                            className="w-full md:w-auto inline-flex items-center justify-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors"
                          >
                            View Facility <ChevronRight size={16} className="ml-1" />
                          </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            
            {/* Quick Links */}
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <h3 className="font-bold text-slate-900 mb-4">Resources</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/products" className="flex items-center text-slate-600 hover:text-primary-600">
                    <ChevronRight size={16} className="mr-2 text-slate-400" />
                    Recommended Products
                  </Link>
                </li>
                <li>
                  <Link to="/providers" className="flex items-center text-slate-600 hover:text-primary-600">
                    <ChevronRight size={16} className="mr-2 text-slate-400" />
                    For Facility Owners
                  </Link>
                </li>
                <li>
                  <Link to={`/assisted-living/${stateSlug}`} className="flex items-center text-slate-600 hover:text-primary-600">
                    <ChevronRight size={16} className="mr-2 text-slate-400" />
                    All {stateName} Cities
                  </Link>
                </li>
              </ul>
            </div>

            {/* Safety Tip */}
            <div className="bg-blue-50 rounded-lg p-6 border border-blue-100">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-blue-600 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-blue-900 text-sm mb-1">Safety Tip</h4>
                  <p className="text-sm text-blue-800">
                    Always verify the facility's license with the {stateName} state department before signing any contracts.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};
