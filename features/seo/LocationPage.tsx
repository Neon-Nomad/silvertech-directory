
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Building2, ChevronRight, Shield, AlertTriangle, FileText, HelpCircle, Phone, DollarSign } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { Map } from '@/components/ui/Map';
import { CITY_COORDINATES } from '@/src/utils/constants';
import { supabase } from '@/src/lib/supabase';
import { stateContent } from '@/src/data/state_content';

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
  
  const [facilities, setFacilities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get rich content for the state if available
  // Try to match by full name (california) or code (ca)
  const contentKey = state ? (stateContent[state.toLowerCase()] ? state.toLowerCase() : Object.keys(stateContent).find(k => stateContent[k].abbreviation.toLowerCase() === state.toLowerCase())) : undefined;
  const content = contentKey ? stateContent[contentKey] : undefined;

  useEffect(() => {
    const fetchFacilities = async () => {
      setLoading(true);
      try {
        let data, error;

        // If State View and we have capital coordinates, fetch nearest to capital
        if (!city && content?.capitalCoordinates) {
            const { data: rpcData, error: rpcError } = await supabase
                .rpc('get_nearby_facilities', {
                    user_lat: content.capitalCoordinates.lat,
                    user_lng: content.capitalCoordinates.lng,
                    max_results: 12
                });
            
            // We need to manually fetch licensing for these since RPC returns only facilities
            if (rpcData) {
                const ids = rpcData.map((f: any) => f.id);
                const { data: licenseData } = await supabase
                    .from('facility_licensing')
                    .select('*')
                    .in('facility_id', ids);
                
                // Merge licensing data
                data = rpcData.map((f: any) => ({
                    ...f,
                    facility_licensing: licenseData?.filter((l: any) => l.facility_id === f.id) || []
                }));
            }
            error = rpcError;
        } else {
            // Standard query
            let query = supabase
            .from('facilities')
            .select('*, facility_licensing(bed_capacity)');
            
            if (state) {
                // Use abbreviation if available from content, otherwise use state param
                const stateQuery = content?.abbreviation || state;
                // We use 'or' to match either full name or abbreviation to be safe
                // But Supabase simple query builder doesn't support OR easily across same column without raw filter
                // So let's just try to match what we have.
                // If we have content, we know the abbreviation.
                query = query.ilike('state', stateQuery);
            }
            
            if (city) {
                const dbCity = city.replace(/-/g, ' ');
                query = query.ilike('city', dbCity);
            }
            
            const result = await query;
            data = result.data;
            error = result.error;
        }

        if (error) {
          console.error('Error fetching facilities:', error);
        } else if (data) {
           const mapped = data.map((f: any) => ({
            id: f.id,
            name: f.name,
            address: `${f.address_line1 || ''}${f.city ? ', ' + f.city : ''}${f.state ? ', ' + f.state : ''} ${f.postal_code || ''}`,
            capacity: f.facility_licensing?.[0]?.bed_capacity || 0,
            type: 'Assisted Living',
            price: 'Call for Pricing',
            rating: 0,
            verified: true,
            vacancy: false,
            phone: f.phone,
            image: null
          }));
          setFacilities(mapped);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchFacilities();
  }, [state, city, content]);

  // Alias facilities to locationFacilities to minimize refactor
  const locationFacilities = facilities;

  const cities = city ? [] : Array.from(new Set(
    locationFacilities.map(f => {
      // Extract city from address string if possible, or use a better method if we had raw city data
      // Since we mapped it, let's try to grab it from the address string we built
      // Format: "Address, City, State Zip"
      const parts = f.address.split(', ');
      return parts.length > 2 ? parts[1] : ''; 
    })
  )).filter(Boolean).sort();

  // Determine map center
  const mapCenter: [number, number] = (city && CITY_COORDINATES[city]) 
    ? CITY_COORDINATES[city] 
    : [36.7783, -119.4179]; // Default to CA center if unknown

  const pageTitle = city 
    ? `Assisted Living in ${cityName}, ${stateName} | SilverTech`
    : (content?.seo.title || `Assisted Living in ${stateName} | SilverTech`);

  const pageDescription = city
    ? `Find the best assisted living facilities in ${cityName}, ${stateName}.`
    : (content?.seo.description || `Find assisted living in ${stateName}.`);

  return (
    <div className="min-h-screen bg-slate-50">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {content?.seo.schema && (
          <script type="application/ld+json">
            {JSON.stringify(content.seo.schema)}
          </script>
        )}
      </Helmet>

      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs />
        </div>
      </div>

      {/* Hero Section */}
      <div className="bg-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">
            {content ? content.overview.title : `Assisted Living in ${city ? `${cityName}, ${stateName}` : stateName}`}
          </h1>
          <p className="text-xl text-primary-100 max-w-3xl">
            {content 
              ? content.overview.content 
              : `Discover top-rated senior living communities in your area. We have verified ${loading ? '...' : facilities.length} facilities in ${city ? cityName : stateName}.`
            }
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Rich Content for State Page */}
            {!city && content && (
              <>
                {/* Overview Bullets */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">Types of Care</h2>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {content.overview.bullets.map((bullet, idx) => (
                      <li key={idx} className="flex items-center text-slate-700">
                        <div className="w-2 h-2 bg-primary-500 rounded-full mr-3" />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Licensing */}
                <div className="bg-white rounded-lg shadow-sm p-6 border-l-4 border-blue-500">
                  <div className="flex items-start gap-4">
                    <Shield className="w-8 h-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-2">Licensing Authority</h2>
                      <p className="text-slate-700 mb-2">
                        <strong>{content.licensing.authority}</strong><br/>
                        {content.licensing.division}
                      </p>
                      <div className="flex flex-wrap gap-4 mt-3">
                        <a href={content.licensing.website} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-medium">Official Website</a>
                        <a href={content.licensing.searchUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline font-medium">Facility Search</a>
                      </div>
                      <p className="text-sm text-slate-500 mt-2">
                        Regulations: {content.licensing.regulations} | Hotline: {content.licensing.hotline}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Admission Requirements */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-2xl font-bold text-slate-900 mb-6">Admission Requirements</h2>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div>
                      <h3 className="font-bold text-green-700 mb-3 flex items-center">
                        <span className="bg-green-100 p-1 rounded mr-2">✓</span> Allowed
                      </h3>
                      <ul className="space-y-2">
                        {content.requirements.admission.allowed.map((item, idx) => (
                          <li key={idx} className="text-slate-700 text-sm">• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="font-bold text-red-700 mb-3 flex items-center">
                        <span className="bg-red-100 p-1 rounded mr-2">✕</span> Prohibited
                      </h3>
                      <ul className="space-y-2">
                        {content.requirements.admission.prohibited.map((item, idx) => (
                          <li key={idx} className="text-slate-700 text-sm">• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Financial Assistance */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <DollarSign className="w-6 h-6 text-green-600" />
                    <h2 className="text-2xl font-bold text-slate-900">Financial Assistance</h2>
                  </div>
                  {content.financialAssistance.programs.map((program, idx) => (
                    <div key={idx} className="mb-6 last:mb-0">
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{program.name}</h3>
                      <p className="text-slate-600 mb-3">{program.description}</p>
                      <div className="bg-slate-50 p-4 rounded-lg">
                        <h4 className="font-medium text-slate-900 mb-2">Eligibility:</h4>
                        <ul className="list-disc list-inside text-sm text-slate-700 space-y-1 mb-3">
                          {program.eligibility.map((e, i) => <li key={i}>{e}</li>)}
                        </ul>
                        {program.contactUrl && (
                          <a href={program.contactUrl} target="_blank" rel="noreferrer" className="text-primary-600 hover:underline text-sm font-medium">
                            Learn More & Apply →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* FAQs */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <HelpCircle className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-slate-900">Frequently Asked Questions</h2>
                  </div>
                  <div className="space-y-6">
                    {content.faqs.map((faq, idx) => (
                      <div key={idx}>
                        <h3 className="font-bold text-slate-900 mb-2">{faq.question}</h3>
                        <p className="text-slate-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            <h2 className="text-2xl font-bold text-slate-900 mb-4">
              {city ? `Top Facilities in ${cityName}` : `Browse by City in ${stateName}`}
            </h2>
            
            {loading ? (
               <div className="py-12 text-center text-slate-500">Loading facilities...</div>
            ) : facilities.length === 0 ? (
               <div className="py-12 text-center text-slate-500">No facilities found in this location.</div>
            ) : (
              <>
                {city ? (
                  // City View: List Facilities
                  <div className="space-y-6">
                    {locationFacilities.map((facility) => (
                      <div key={facility.id} className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xl font-bold text-slate-900 mb-2">
                              <Link to={`/facility/${facility.id}`} className="hover:text-primary-600">
                                {facility.name}
                              </Link>
                            </h3>
                            <div className="flex items-center text-slate-600 mb-2">
                              <MapPin size={18} className="mr-2 text-slate-400" />
                              {facility.address}
                            </div>
                            <div className="flex items-center text-slate-600">
                              <Building2 size={18} className="mr-2 text-slate-400" />
                              {facility.type} • Capacity: {facility.capacity}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary-600">{facility.price}</div>
                            <div className="text-sm text-slate-500">per month</div>
                          </div>
                        </div>
                        
                        <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
                          <div className="flex items-center gap-4">
                            {facility.verified && (
                              <span className="text-xs font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                Verified Provider
                              </span>
                            )}
                          </div>
                          <Link 
                            to={`/facility/${facility.id}`}
                            className="flex items-center text-primary-600 font-medium hover:text-primary-700"
                          >
                            View Details <ChevronRight size={16} className="ml-1" />
                          </Link>
                        </div>
                      </div>
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
              </>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map Widget */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-bold text-slate-900 mb-4">Location Map</h3>
              <div className="h-64 rounded-lg overflow-hidden bg-slate-100 relative">
                 <Map center={mapCenter} />
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-bold text-slate-900 mb-4">Quick Facts</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex justify-between">
                  <span>Total Facilities</span>
                  <span className="font-medium text-slate-900">{facilities.length}</span>
                </li>
                <li className="flex justify-between">
                  <span>Avg. Price</span>
                  <span className="font-medium text-slate-900">$4,500/mo</span>
                </li>
                <li className="flex justify-between">
                  <span>State Tax</span>
                  <span className="font-medium text-slate-900">Exempt</span>
                </li>
              </ul>
            </div>
            
            {/* Complaints Widget (State View Only) */}
            {!city && content && (
              <div className="bg-white rounded-lg shadow-sm p-6 border-t-4 border-red-500">
                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="text-red-500 w-5 h-5" />
                  File a Complaint
                </h3>
                <div className="space-y-4">
                  {content.complaints.methods.map((method, idx) => (
                    <div key={idx} className="text-sm">
                      <div className="font-medium text-slate-800">{method.name}</div>
                      <div className="text-slate-600">{method.contact}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
