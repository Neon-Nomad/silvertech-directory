import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Star, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Map } from '@/components/ui/Map';
import { supabase } from '@/src/lib/supabase';
import { geocodeAddress } from '@/src/utils/geocoding';
import { ReviewList } from '@/features/reviews/ReviewList';
import { ReviewModal } from '@/features/reviews/ReviewModal';
import { useAuth } from '@/src/context/AuthProvider';
import { PhotoGallery } from '@/components/ui/PhotoGallery';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';
import { DistanceMapCard } from '@/components/ui/DistanceMapCard';
import { VeteransBenefitsList } from '@/components/resources/VeteransBenefitsList';
import { calculateHealthcareScore, getNearestHospital, HealthcareScore, Hospital } from '@/src/utils/hospitalData';
import { HealthcareScoreCard } from '@/features/family/discovery/HealthcareScoreCard';
import { getOmbudsman, OmbudsmanProgram } from '@/src/utils/ombudsmanData';
import { OmbudsmanCard } from '@/features/family/support/OmbudsmanCard';
import { getLicensingAuthority, LicensingAuthority } from '@/src/utils/licensingData';
import { LicensingAuthorityCard } from '@/features/family/support/LicensingAuthorityCard';
import { getAgingAgency, AgingAgency } from '@/src/utils/agingAgencyData';
import { AgingAgencyCard } from '@/features/family/support/AgingAgencyCard';
import { ALL_STATES } from '@/src/data/states';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { CompareToolModal } from '@/features/family/discovery/CompareToolModal';
import { LeadModal } from '@/features/family/discovery/LeadModal';
import { trackEvent } from '@/src/utils/analytics';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { FactGrid } from '@/components/ui/FactGrid';
import { StickySectionTabs } from '@/components/ui/StickySectionTabs';

const toRad = (value: number) => (value * Math.PI) / 180;
const getDistanceMiles = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 3958.8;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);

  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
};

export const FacilityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [healthcareScore, setHealthcareScore] = useState<HealthcareScore | null>(null);
  const [nearestHospital, setNearestHospital] = useState<{ hospital: Hospital; distance: number } | null>(null);
  const [ombudsman, setOmbudsman] = useState<OmbudsmanProgram | null>(null);
  const [licensingAuthority, setLicensingAuthority] = useState<LicensingAuthority | null>(null);
  const [agingAgency, setAgingAgency] = useState<AgingAgency | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem('geo_coords');
    if (!stored) return;
    try {
      const coords = JSON.parse(stored) as { lat: number; lng: number };
      if (coords?.lat && coords?.lng) {
        setUserCoords(coords);
      }
    } catch {
      setUserCoords(null);
    }
  }, []);

  useEffect(() => {
    const fetchFacility = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select(`
            *,
            facility_licensing(*),
            facility_photos(*),
            facility_amenities(
              amenities(*)
            ),
            facility_care_types(
              care_types(*)
            )
          `)
          .eq('id', id)
          .single();

        if (error) throw error;

        if (!data.latitude || !data.longitude) {
          const fullAddress = `${data.address_line1}, ${data.city}, ${data.state}`;
          const coords = await geocodeAddress(fullAddress);

          if (coords) {
            data.latitude = coords.lat;
            data.longitude = coords.lng;
          }
        }

        if (data.facility_photos) {
          data.facility_photos.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
        }

        setFacility(data);

        if (data.latitude && data.longitude && data.state) {
          try {
            const score = await calculateHealthcareScore(data.latitude, data.longitude, data.state, data.city);
            setHealthcareScore(score);

            const nearest = await getNearestHospital(data.latitude, data.longitude, data.state, data.city);
            setNearestHospital(nearest);
          } catch (e) {
            console.error('Error calculating healthcare score:', e);
          }
        }

        if (data.state) {
          setOmbudsman(getOmbudsman(data.state));
          setLicensingAuthority(getLicensingAuthority(data.state));
          setAgingAgency(getAgingAgency(data.state));
        }
      } catch (err) {
        console.error('Error fetching facility:', err);
        setError('Failed to load facility details.');
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center max-w-md px-4">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Facility Not Found</h2>
            <p className="text-slate-600 mb-6">
              We couldn't find the facility you're looking for. It may have been removed or the link is incorrect.
            </p>
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse All Facilities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = `${facility.address_line1}${facility.address_line2 ? ', ' + facility.address_line2 : ''}, ${facility.city}, ${facility.state} ${facility.postal_code}`;
  const license = facility.facility_licensing?.[0];
  const capacity = license?.bed_capacity || 0;
  const licenseNumber = license?.license_number || 'Pending';

  const amenitiesList = facility.facility_amenities?.map((fa: any) => fa.amenities) || [];
  const groupedAmenities: Record<string, any[]> = {};
  amenitiesList.forEach((amenity: any) => {
    if (!groupedAmenities[amenity.category]) {
      groupedAmenities[amenity.category] = [];
    }
    groupedAmenities[amenity.category].push(amenity);
  });

  const careTypes = facility.facility_care_types?.map((fct: any) => fct.care_types) || [];
  const hasMemoryCare = careTypes.some((c: any) => c.name.toLowerCase().includes('memory') || c.name.toLowerCase().includes('dementia'));
  const serviceTypeString = hasMemoryCare ? 'Assisted Living & Memory Care' : 'Assisted Living';

  const lastUpdatedRaw =
    license?.updated_at ||
    facility.updated_at ||
    facility.created_at ||
    null;

  const lastUpdated = lastUpdatedRaw
    ? new Date(lastUpdatedRaw).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : 'Not available';

  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'SeniorLivingCommunity',
    name: facility.name,
    identifier: licenseNumber !== 'Pending' ? licenseNumber : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: facility.address_line1,
      addressLocality: facility.city,
      addressRegion: facility.state,
      postalCode: facility.postal_code,
      addressCountry: 'US'
    },
    telephone: facility.phone,
    image: facility.facility_photos?.[0]?.url || facility.image || 'https://silvertechdirectory.com/default-facility.jpg',
    priceRange: facility.min_price ? `$${facility.min_price} - $${facility.max_price}` : 'Call for Pricing',
    description: facility.description || `${serviceTypeString} facility in ${facility.city}, ${facility.state}.`,
    geo: facility.latitude && facility.longitude ? {
      '@type': 'GeoCoordinates',
      latitude: facility.latitude,
      longitude: facility.longitude
    } : undefined,
    url: window.location.href,
    dateModified: lastUpdatedRaw || undefined
  };

  const stateSlug = ALL_STATES.find(s => s.abbreviation === facility.state)?.slug || facility.state.toLowerCase();
  const citySlug = facility.city.toLowerCase().replace(/ /g, '-');
  const canonicalUrl = `https://silvertechdirectory.com/facility/${id}`;
  const shareImage = facility.facility_photos?.[0]?.url || facility.image || 'https://silvertechdirectory.com/hero.png';
  const heroImage = shareImage;
  const pageTitle = `${facility.name} - ${serviceTypeString} in ${facility.city}, ${facility.state} | SilverTech`;
  const pageDescription = `Learn about ${facility.name}, a premier ${serviceTypeString} community in ${facility.city}, ${facility.state}. View pricing, photos, amenities, and licensing info (Lic: ${licenseNumber}). Capacity: ${capacity} beds.`;

  const distanceMiles = useMemo(() => {
    if (!userCoords || !facility.latitude || !facility.longitude) return null;
    return getDistanceMiles(userCoords, { lat: facility.latitude, lng: facility.longitude });
  }, [userCoords, facility.latitude, facility.longitude]);

  const driveMinutes = useMemo(() => {
    if (!distanceMiles) return null;
    const mph = 30;
    return Math.max(5, Math.round((distanceMiles / mph) * 60));
  }, [distanceMiles]);

  const mapUrl = useMemo(() => {
    if (!facility.latitude || !facility.longitude) return null;
    const destination = `${facility.latitude},${facility.longitude}`;
    const origin = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  }, [facility.latitude, facility.longitude, userCoords]);

  const tabs = [
    { label: 'Overview', href: '#overview' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Services', href: '#services' },
    { label: 'Map', href: '#map' },
    { label: 'Licensing', href: '#licensing' },
    { label: 'Reviews', href: '#reviews' }
  ];

  return (
    <div className="min-h-screen bg-[#f6f1ea] pb-20">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={shareImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={shareImage} />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
      </Helmet>

      <div className="bg-[#f6f1ea]">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumbs items={[
            { label: 'Home', path: '/' },
            { label: 'Assisted Living', path: '/assisted-living' },
            { label: facility.state, path: `/assisted-living/${stateSlug}` },
            { label: facility.city, path: `/assisted-living/${stateSlug}/${citySlug}` },
            { label: facility.name }
          ]} />
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-6" id="overview">
        <Card className="p-6 md:p-8">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <span className="px-2 py-1 rounded-full bg-slate-100 border border-slate-200">{serviceTypeString}</span>
                <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                  {facility.owner_id ? 'Premium Member' : 'Community Listing'}
                </span>
                {facility.owner_id && (
                  <span className="px-2 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">Verified</span>
                )}
              </div>

              <h1 className="text-[26px] md:text-[28px] font-semibold text-slate-900 mt-3">
                {facility.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600 mt-2">
                <MapPin className="h-4 w-4 text-slate-400" />
                <span>
                  {facility.city}, {facility.state}
                </span>
                <span className="text-slate-300">|</span>
                <span>{fullAddress}</span>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                  <p className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Price range</p>
                  <p className="text-[16px] font-semibold text-slate-900">
                    {facility.min_price ? `$${facility.min_price.toLocaleString()} - $${facility.max_price?.toLocaleString() || ''}` : 'Call for Pricing'}
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-lg px-4 py-3">
                  <p className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Distance</p>
                  <p className="text-[16px] font-semibold text-slate-900">
                    {distanceMiles ? `${distanceMiles.toFixed(1)} miles` : 'Approximate'}
                    {driveMinutes ? ` (${driveMinutes} min)` : ''}
                  </p>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-slate-300 hover:bg-slate-100"
                  onClick={() => setIsCompareModalOpen(true)}
                >
                  Compare
                </Button>
                {mapUrl && (
                  <Button
                    variant="outline"
                    className="border-slate-300 hover:bg-slate-100"
                    onClick={() => window.open(mapUrl, '_blank')}
                  >
                    Directions
                  </Button>
                )}
              </div>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
              <img
                src={heroImage}
                alt={`${facility.name} hero`}
                className="w-full h-[260px] object-cover"
                loading="eager"
                decoding="async"
                fetchPriority="high"
              />
            </div>
          </div>
        </Card>
      </div>

      <StickySectionTabs items={tabs} />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 mt-10 grid lg:grid-cols-[1fr_320px] gap-10">
        <div className="space-y-16">
          <Card>
            <SectionHeader title="Quick facts" helper="Scan the essentials before you go deeper." />
            <div className="mt-6">
              <FactGrid
                items={[
                  { label: 'Price range', value: facility.min_price ? `$${facility.min_price.toLocaleString()} - $${facility.max_price?.toLocaleString() || ''}` : 'Call for Pricing' },
                  { label: 'Care types', value: careTypes.length ? careTypes.map((c: any) => c.name).join(', ') : serviceTypeString },
                  { label: 'Capacity', value: `${capacity} beds` },
                  { label: 'License', value: licenseNumber },
                  { label: 'Distance', value: distanceMiles ? `${distanceMiles.toFixed(1)} miles` : 'Approximate' },
                  { label: 'Rating', value: facility.rating ? `${facility.rating}/5` : 'Not yet rated' }
                ]}
              />
            </div>
          </Card>

          <Card>
            <SectionHeader title="Helping you decide" helper="Short, practical answers to the most important questions." />
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-slate-900">Best for</h3>
                <ul className="mt-3 text-sm text-slate-600 space-y-2">
                  <li>Families needing {serviceTypeString.toLowerCase()} in {facility.city}.</li>
                  <li>Residents who prefer a smaller community (capacity {capacity} beds).</li>
                  <li>Those prioritizing a licensed, regulated environment.</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-slate-900">Not ideal if</h3>
                <ul className="mt-3 text-sm text-slate-600 space-y-2">
                  <li>You need a lower monthly price than listed.</li>
                  <li>You are looking for a hospital-level medical setting.</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-slate-900">Cost clarity</h3>
                <ul className="mt-3 text-sm text-slate-600 space-y-2">
                  <li>Base pricing reflects standard care and housing.</li>
                  <li>Higher care needs can raise monthly costs.</li>
                </ul>
              </div>
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-slate-900">Safety snapshot</h3>
                <ul className="mt-3 text-sm text-slate-600 space-y-2">
                  <li>Licensed facility with ID: {licenseNumber}.</li>
                  <li>Regulated by state licensing authorities.</li>
                </ul>
              </div>
            </div>
          </Card>

          <Card id="pricing">
            <SectionHeader title="Pricing" helper="Understand baseline pricing and what can change it." />
            <div className="mt-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Starting range</p>
                  <p className="text-[16px] font-semibold text-slate-900 mt-1">
                    {facility.min_price ? `$${facility.min_price.toLocaleString()} - $${facility.max_price?.toLocaleString() || ''}` : 'Call for Pricing'}
                  </p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Includes</p>
                  <p className="text-sm text-slate-600 mt-1">Housing, meals, and baseline care services.</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-slate-600">
                Costs can change based on care level, room type, and additional services. Request a tour for a tailored quote.
              </div>
            </div>
          </Card>

          <Card id="services">
            <SectionHeader title="Services & daily life" helper="What residents can expect on a daily basis." />
            <div className="mt-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[16px] font-semibold text-slate-900 mb-3">Care services</h3>
                  {careTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {careTypes.map((care: any) => (
                        <span key={care.id} className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-sm border border-slate-200">
                          {care.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Care types not listed yet.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-slate-900 mb-3">Amenities</h3>
                  {amenitiesList.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-600">
                      {amenitiesList.slice(0, 8).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-500" />
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-slate-600">Amenities not listed yet.</p>
                  )}
                </div>
              </div>

              <div className="mt-8">
                <SectionHeader title="Photo gallery" />
                <div className="mt-4">
                  <PhotoGallery photos={facility.facility_photos || []} facilityName={facility.name} />
                </div>
              </div>
            </div>
          </Card>

          <div id="map">
            <DistanceMapCard
              facilityName={facility.name}
              facilityLat={facility.latitude}
              facilityLng={facility.longitude}
              facilityAddress={fullAddress}
            />
          </div>

          <Card id="licensing">
            <SectionHeader title="Safety & legitimacy" helper="Verified through state licensing and oversight bodies." />
            <div className="mt-6 space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">License number</p>
                  <p className="text-[16px] font-semibold text-slate-900 mt-1">{licenseNumber}</p>
                </div>
                <div className="border border-slate-200 rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-slate-500 font-medium">Authority</p>
                  <p className="text-[16px] font-semibold text-slate-900 mt-1">{licensingAuthority?.agency_name || 'State licensing authority'}</p>
                </div>
              </div>

              <ContentMeta updated={lastUpdated} />
              <DataSourceNote note="Sources: State licensing authority, CMS datasets, and verified provider submissions." />

              {licensingAuthority && <LicensingAuthorityCard authority={licensingAuthority} />}
              {ombudsman && <OmbudsmanCard program={ombudsman} />}
              {agingAgency && <AgingAgencyCard agency={agingAgency} variant="compact" />}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Comparison mode" helper="See how this community stacks up against nearby options." />
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" className="border-slate-300 hover:bg-slate-100" onClick={() => setIsCompareModalOpen(true)}>
                Compare similar homes
              </Button>
              <Button variant="outline" className="border-slate-300 hover:bg-slate-100" onClick={() => navigate(`/assisted-living/${stateSlug}/${citySlug}`)}>
                View all in {facility.city}
              </Button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Who this community is right for" helper="A quick mental shortcut to help with the decision." />
            <div className="mt-6 text-sm text-slate-600 space-y-2">
              <p>This community may be a good fit for families seeking {serviceTypeString.toLowerCase()} care in {facility.city} with a licensed setting.</p>
              <p>It is best for residents who value structured support and a community size of about {capacity} beds.</p>
            </div>
          </Card>

          <Card id="reviews">
            <SectionHeader title="Reviews" helper="Verified feedback and family impressions." />
            <div className="mt-6 flex justify-between items-center">
              <h3 className="text-[16px] font-semibold text-slate-900">Latest reviews</h3>
              <Button
                variant="outline"
                onClick={() => {
                  if (user) {
                    setIsReviewModalOpen(true);
                  } else {
                    navigate('/login');
                  }
                }}
              >
                Write a Review
              </Button>
            </div>
            <div className="mt-6">
              <ReviewList facilityId={id!} refreshTrigger={refreshReviews} />
            </div>
          </Card>

          <Card>
            <SectionHeader title="Next step" helper="When you're ready, take the next action." />
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    trackEvent('lead_cta_clicked', { source: 'next_step', facilityId: facility.id });
                    setIsLeadModalOpen(true);
                  }}
                >
                  Schedule a Tour
                </Button>
              {facility.phone && (
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-slate-300 hover:bg-slate-100"
                  onClick={() => window.location.href = `tel:${facility.phone}`}
                >
                  Call {facility.phone}
                </Button>
              )}
            </div>
          </Card>

          <div id="financial-help">
            <VeteransBenefitsList />
          </div>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-28 h-fit">
          <Card>
            <SectionHeader title="Your next actions" />
            <div className="mt-4 space-y-3">
              <Button
                variant="primary"
                className="w-full"
                onClick={() => {
                  trackEvent('lead_cta_clicked', { source: 'sidebar', facilityId: facility.id });
                  setIsLeadModalOpen(true);
                }}
              >
                Schedule a Private Tour
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-100"
                onClick={() => setIsCompareModalOpen(true)}
              >
                Compare similar homes
              </Button>
              <Button
                variant="outline"
                className="w-full border-slate-300 hover:bg-slate-100"
                onClick={() => navigate(`/assisted-living/${stateSlug}/${citySlug}`)}
              >
                Back to {facility.city} list
              </Button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Contact" />
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-slate-400" />
                <span>{fullAddress}</span>
              </div>
              {facility.phone && (
                <a
                  href={`tel:${facility.phone}`}
                  className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900"
                >
                  <Phone className="w-4 h-4" />
                  {facility.phone}
                </a>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Monthly cost" />
            <div className="mt-4">
              <div className="flex items-center gap-2 text-slate-900">
                <DollarSign className="h-6 w-6 text-slate-700" />
                <span className="text-[22px] font-semibold">
                  {facility.min_price ? `$${facility.min_price.toLocaleString()}` : 'Call'}
                </span>
                {facility.max_price && <span className="text-sm text-slate-500">- ${facility.max_price.toLocaleString()}</span>}
              </div>
              <div className="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1 inline-flex items-center gap-2">
                <Star className="h-4 w-4 fill-current" />
                Premium placement available
              </div>
            </div>
          </Card>

          {healthcareScore && (
            <HealthcareScoreCard
              score={healthcareScore}
              nearestHospital={nearestHospital?.hospital || null}
              nearestDistance={nearestHospital?.distance || null}
            />
          )}
        </aside>
      </div>

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        facilityId={id!}
        facilityName={facility.name}
        onReviewSubmitted={() => setRefreshReviews(prev => prev + 1)}
      />

      <LeadModal
        isOpen={isLeadModalOpen}
        onClose={() => setIsLeadModalOpen(false)}
        facilityId={id!}
        facilityName={facility.name}
      />

      <CompareToolModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        baseFacility={facility}
      />
    </div>
  );
};
