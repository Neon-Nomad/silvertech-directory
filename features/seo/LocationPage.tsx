import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Building2, ChevronRight } from 'lucide-react';
import facilitiesData from '../../src/data/facilities.json';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

// Helper to format strings (e.g., "san-francisco" -> "San Francisco")
const formatName = (slug: string) => {
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper to get state name from code
const getStateName = (code: string) => {
  const states: Record<string, string> = {
    al: 'Alabama', ak: 'Alaska', az: 'Arizona', ar: 'Arkansas', ca: 'California',
    co: 'Colorado', ct: 'Connecticut', de: 'Delaware', fl: 'Florida', ga: 'Georgia',
    hi: 'Hawaii', id: 'Idaho', il: 'Illinois', in: 'Indiana', ia: 'Iowa',
    ks: 'Kansas', ky: 'Kentucky', la: 'Louisiana', me: 'Maine', md: 'Maryland',
    ma: 'Massachusetts', mi: 'Michigan', mn: 'Minnesota', ms: 'Mississippi', mo: 'Missouri',
    mt: 'Montana', ne: 'Nebraska', nv: 'Nevada', nh: 'New Hampshire', nj: 'New Jersey',
    nm: 'New Mexico', ny: 'New York', nc: 'North Carolina', nd: 'North Dakota', oh: 'Ohio',
    ok: 'Oklahoma', or: 'Oregon', pa: 'Pennsylvania', ri: 'Rhode Island', sc: 'South Carolina',
    sd: 'South Dakota', tn: 'Tennessee', tx: 'Texas', ut: 'Utah', vt: 'Vermont',
    va: 'Virginia', wa: 'Washington', wv: 'West Virginia', wi: 'Wisconsin', wy: 'Wyoming'
  };
  return states[code.toLowerCase()] || code.toUpperCase();
};

export const LocationPage: React.FC = () => {
  const { state, city } = useParams<{ state: string; city?: string }>();
  const stateName = state ? getStateName(state) : '';
  const cityName = city ? formatName(city) : '';

  // Filter facilities
  const locationFacilities = facilitiesData.filter(facility => {
    const facilityState = facility.address.split(', ').pop()?.split(' ')[0].toLowerCase();
    if (facilityState !== state?.toLowerCase()) return false;
    
    if (city) {
      const facilityCity = facility.address.split(', ')[1]?.toLowerCase();
      return facilityCity === city.replace(/-/g, ' ').toLowerCase();
    }
    return true;
  });

  // Get unique cities for the state view
  const cities = city ? [] : Array.from(new Set(
    locationFacilities.map(f => {
      const parts = f.address.split(', ');
      return parts.length > 2 ? parts[1] : '';
    })
  )).filter(Boolean).sort();

  const title = city 
    ? `Assisted Living in ${cityName}, ${stateName} | SilverTech Directory`
    : `Assisted Living in ${stateName} | SilverTech Directory`;

  const description = city
    ? `Find the best assisted living facilities in ${cityName}, ${stateName}. Compare pricing, reviews, and availability for senior care in ${cityName}.`
    : `Browse top-rated assisted living and senior care facilities in ${stateName}. Find care options near you in ${stateName}.`;

  const breadcrumbItems = [
    { label: 'Assisted Living', path: '/search' },
    { label: stateName, path: `/assisted-living/${state}` },
    ...(city ? [{ label: cityName }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={window.location.href} />
      </Helmet>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">
          {city ? `Assisted Living in ${cityName}, ${stateName}` : `Senior Care in ${stateName}`}
        </h1>
        
        <p className="text-lg text-slate-600 mb-8 max-w-3xl">
          {city 
            ? `Discover ${locationFacilities.length} senior living options in ${cityName}. We help families find the right care with verified reviews and transparent pricing.`
            : `Explore senior living options across ${stateName}. Browse by city to find the perfect community for your loved ones.`
          }
        </p>

import { Map, CITY_COORDINATES } from '@/components/ui/Map';

// ... (existing imports)

// ... (inside LocationPage component)

  // Determine map center
  const mapCenter: [number, number] | undefined = city 
    ? CITY_COORDINATES[city.toLowerCase()] 
    : (state?.toLowerCase() === 'ca' ? [36.7783, -119.4179] : undefined); // Default to CA center

  return (
    // ... (existing JSX)
    
        {/* Map Section */}
        {mapCenter && (
          <div className="h-96 w-full mb-12 rounded-xl overflow-hidden shadow-sm border border-slate-200 z-0 relative">
             <Map facilities={locationFacilities} center={mapCenter} zoom={city ? 12 : 6} />
          </div>
        )}


        {city ? (
          // City View: List Facilities
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {locationFacilities.map((facility) => (
              <Link 
                key={facility.id} 
                to={`/facility/${facility.id}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-slate-200 group"
              >
                <div className="h-48 bg-slate-200 relative">
                  {/* @ts-ignore */}
                  {facility.image && (
                    <img 
                      src={facility.image} 
                      alt={facility.name}
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                </div>
                <div className="p-6">
                  <h3 className="font-bold text-lg text-slate-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {facility.name}
                  </h3>
                  <p className="text-slate-500 text-sm flex items-start gap-2 mb-4">
                    <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    {facility.address}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="bg-primary-50 text-primary-700 text-xs font-medium px-2.5 py-0.5 rounded">
                      {facility.type}
                    </span>
                    <span className="text-sm font-medium text-slate-900">
                      {facility.price}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          // State View: List Cities
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cities.map((c) => (
              <Link
                key={c}
                to={`/assisted-living/${state}/${c.toLowerCase().replace(/ /g, '-')}`}
                className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 hover:border-primary-500 hover:shadow-md transition-all flex items-center justify-between group"
              >
                <span className="font-medium text-slate-700 group-hover:text-primary-700">
                  {c}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-primary-500" />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
