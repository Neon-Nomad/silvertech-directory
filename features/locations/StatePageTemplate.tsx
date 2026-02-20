import React, { useEffect, useState } from 'react';
import { useParams, Navigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ALL_STATES } from '../../src/data/states';
import { useJsonLd } from '../../src/hooks/useJsonLd';
import { Breadcrumbs } from '../../components/ui/Breadcrumbs';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';
import { supabase } from '../../src/lib/supabase';
import { loadCityIndex } from '@/src/utils/facilityIndex';
import { getOmbudsman } from '../../src/utils/ombudsmanData';
import { OmbudsmanCard } from '../family/support/OmbudsmanCard';
import { getLicensingAuthority } from '../../src/utils/licensingData';
import { LicensingAuthorityCard } from '../family/support/LicensingAuthorityCard';
import { getAgingAgency } from '../../src/utils/agingAgencyData';
import { AgingAgencyCard } from '../family/support/AgingAgencyCard';
import { getMedicaidWaiver } from '../../src/utils/medicaidData';
import { MedicaidWaiverCard } from '../family/finance/MedicaidWaiverCard';

interface CityStat {
  city: string;
  count: number;
  slug: string;
}

export const StatePageTemplate: React.FC = () => {
  const { state } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find(s => s.slug === state);
  const [cities, setCities] = useState<CityStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [facilityCount, setFacilityCount] = useState(0);

  useEffect(() => {
    if (!stateDef) return;

    const fetchCities = async () => {
      setLoading(true);
      try {
        // 1. Get all facilities for this state (Supabase primary)
        const { data, error } = await supabase
          .from('facilities')
          .select('city')
          .eq('state', stateDef.abbreviation);

        if (error) throw error;

        if (data) {
          setFacilityCount(data.length);

          // 2. Aggregate cities and counts
          const cityMap = new Map<string, number>();
          data.forEach(f => {
            if (f.city) {
              const city = f.city.trim();
              cityMap.set(city, (cityMap.get(city) || 0) + 1);
            }
          });

          // 3. Convert to array and sort
          const cityList: CityStat[] = Array.from(cityMap.entries())
            .map(([city, count]) => ({
              city,
              count,
              slug: city.toLowerCase().replace(/ /g, '-')
            }))
            .sort((a, b) => a.city.localeCompare(b.city));

          setCities(cityList);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching cities from Supabase:', err);
      }

      try {
        // Fallback to static index
        const cityIndex = await loadCityIndex();
        const stateCities = cityIndex
          .filter((entry) => entry.stateSlug === stateDef.slug)
          .sort((a, b) => a.cityName.localeCompare(b.cityName));

        setFacilityCount(stateCities.reduce((sum, entry) => sum + entry.count, 0));
        setCities(stateCities.map((entry) => ({
          city: entry.cityName,
          count: entry.count,
          slug: entry.citySlug
        })));
      } catch (err) {
        console.error('Error loading static city index:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCities();
  }, [stateDef]);

  if (!stateDef) {
    return <Navigate to="/" replace />;
  }

  const pageTitle = `Senior Living in ${stateDef.name} | Assisted Living & Memory Care`;
  const pageDescription = `Find the best senior living and assisted living facilities in ${stateDef.name}. Compare costs, read reviews, and view photos of communities in ${stateDef.name}.`;

  // Schema for the state page
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": `Assisted Living in ${stateDef.name}`,
    "description": pageDescription,
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": "https://silvertechdirectory.com"
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Assisted Living",
          "item": "https://silvertechdirectory.com/assisted-living"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": stateDef.name
        }
      ]
    }
  };

  useJsonLd(schema);

  return (
    <div className="min-h-screen bg-warm-gray font-sans text-slate-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={`https://silvertechdirectory.com/assisted-living/${stateDef.slug}/`} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={`https://silvertechdirectory.com/assisted-living/${stateDef.slug}`} />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
      </Helmet>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs 
            items={[
              { label: 'Home', path: '/' },
              { label: 'Assisted Living', path: '/assisted-living' },
              { label: stateDef.name, path: `/assisted-living/${stateDef.slug}` },
            ]} 
          />
          
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mt-6 mb-4">
            {stateDef.name} Senior Living & Memory Care Directory
          </h1>
          
          <p className="text-xl text-slate-600 max-w-3xl">
            Browse our comprehensive directory of assisted living and memory care facilities in {stateDef.name}. 
            We provide transparent information, direct contact details, and unbiased resources to help you make the right choice for your family.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ContentMeta />
        <div className="mt-3">
          <DataSourceNote />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Intro / Mission */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 mb-12">
          <h2 className="text-2xl font-bold mb-4">Why SilverTech Directory?</h2>
          <p className="text-slate-600 mb-4">
            Unlike other "free" referral services, we don't sell your information to dozens of facilities. 
            Our mission is to provide a transparent, ethical alternative for families seeking senior care in {stateDef.name}.
            We list every licensed facility, not just the ones that pay us.
          </p>
          <div className="flex flex-wrap gap-4 mt-6">
             <Link to="/honest-care" className="text-primary-600 font-medium hover:underline">
               Read our Honest Care Policy &rarr;
             </Link>
             <Link to="/products" className="text-primary-600 font-medium hover:underline">
               View Recommended Products &rarr;
             </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
            <span className="block text-3xl font-bold text-primary-600 mb-2">
              {loading ? '...' : facilityCount}
            </span>
            <span className="text-slate-600">Total Facilities</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
            <span className="block text-3xl font-bold text-primary-600 mb-2">
              {loading ? '...' : cities.length}
            </span>
            <span className="text-slate-600">Cities Covered</span>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 text-center">
            <span className="block text-3xl font-bold text-primary-600 mb-2">Free</span>
            <span className="text-slate-600">Directory Access</span>
          </div>
        </div>

        {/* Top Cities Highlight (Phase 4) */}
        {cities.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Top Cities in {stateDef.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {cities.slice(0, 6).map((city) => (
                <Link 
                  key={city.city}
                  to={`/assisted-living/${stateDef.slug}/cities/${city.slug}`}
                  className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-all group"
                >
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-700 mb-2">
                    {city.city}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {city.count} licensed facilities
                  </p>
                  <span className="inline-block mt-4 text-sm font-medium text-primary-600 group-hover:underline">
                    View all facilities &rarr;
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Cities Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">All Cities in {stateDef.name}</h2>
          {loading ? (
            <div className="text-center py-12 text-slate-500">Loading cities...</div>
          ) : cities.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {cities.map((city) => (
                <Link 
                  key={city.city}
                  to={`/assisted-living/${stateDef.slug}/cities/${city.slug}`}
                  className="bg-white p-4 rounded-lg border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all flex justify-between items-center group"
                >
                  <span className="font-medium text-slate-700 group-hover:text-primary-700">
                    {city.city}
                  </span>
                  <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full group-hover:bg-primary-50 group-hover:text-primary-600">
                    {city.count}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 p-12 rounded-xl border border-dashed border-slate-300 text-center text-slate-500">
              No facilities found in {stateDef.name} yet. We are actively expanding our database.
            </div>
          )}
        </div>

        {/* Medicaid & Financial Aid Section */}
        {stateDef && getMedicaidWaiver(stateDef.abbreviation) && (
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Medicaid & Financial Aid</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <MedicaidWaiverCard waiver={getMedicaidWaiver(stateDef.abbreviation)!} />
              
              <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
                <h3 className="font-bold text-slate-900 mb-4">Does Medicaid Pay for Assisted Living?</h3>
                <p className="text-slate-600 mb-4 leading-relaxed">
                  In many states, Medicaid <strong>does not</strong> pay for room and board in assisted living. However, HCBS Waivers (like the one shown here) can pay for the <em>care services</em> provided in the facility.
                </p>
                <div className="bg-primary-50 p-4 rounded-lg border border-primary-100">
                  <h4 className="font-semibold text-primary-900 text-sm mb-2">Key Takeaway</h4>
                  <p className="text-sm text-primary-800">
                    You typically still need to pay for "Room & Board" (rent + food) out of pocket or via SSI, while the Waiver covers the "Assisted Living Services" (care).
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* State Resources */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6">State Resources & Consumer Protection</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {stateDef && getOmbudsman(stateDef.abbreviation) && (
              <OmbudsmanCard program={getOmbudsman(stateDef.abbreviation)!} variant="full" />
            )}

            {stateDef && getAgingAgency(stateDef.abbreviation) && (
              <AgingAgencyCard agency={getAgingAgency(stateDef.abbreviation)!} variant="full" />
            )}

            {stateDef && getLicensingAuthority(stateDef.abbreviation) && (
                <LicensingAuthorityCard authority={getLicensingAuthority(stateDef.abbreviation)!} variant="full" />
            )}
            
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
               <h3 className="font-bold text-slate-900 mb-4">Why Contact the Ombudsman?</h3>
               <ul className="space-y-3 text-slate-600 text-sm">
                 <li className="flex items-start gap-2">
                   <span className="text-primary-600 font-bold">•</span>
                   <span>Resolve complaints about quality of care or resident rights.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <span className="text-primary-600 font-bold">•</span>
                   <span>Get help with eviction or discharge notices.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <span className="text-primary-600 font-bold">•</span>
                   <span>Learn about facility inspection reports and history.</span>
                 </li>
                 <li className="flex items-start gap-2">
                   <span className="text-primary-600 font-bold">•</span>
                   <span>Advocate for better food, hygiene, and staffing levels.</span>
                 </li>
               </ul>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
