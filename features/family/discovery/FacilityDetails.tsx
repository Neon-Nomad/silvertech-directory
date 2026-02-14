import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Star, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Map } from '@/components/ui/Map';
import { supabase } from '@/src/lib/supabase';
import { loadFacilityIndex } from '@/src/utils/facilityIndex';
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
import { FacilityQA } from '@/features/family/discovery/FacilityQA';
import { useFacilityQuestions } from '@/src/hooks/useFacilityQuestions';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { useLeadTracking } from '@/src/hooks/useLeadTracking';

const toRad = (value: number) => (value * Math.PI) / 180;
const isUuid = (value?: string) =>
  Boolean(value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value));
const maskPhoneNumber = (phone?: string | null) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  return `(${area}) ${prefix[0]}XX-XXXX`;
};
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
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const { trackLeadEvent } = useLeadTracking();

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
    if (typeof window === 'undefined') return;
    if (userCoords) return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const coords = { lat: latitude, lng: longitude };
        localStorage.setItem('geo_coords', JSON.stringify(coords));
        localStorage.setItem('geo_status', 'granted');
        setUserCoords(coords);
      },
      () => {
        localStorage.setItem('geo_status', 'denied');
      }
    );
  }, [userCoords]);

  useEffect(() => {
    const fetchFacility = async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        let data = null;
        let error = null;

        if (isUuid(id)) {
          const result = await supabase
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
          data = result.data;
          error = result.error;
        } else {
          const index = await loadFacilityIndex();
          const fallback = index.find((item) => item.id === id);
          if (fallback) {
            const result = await supabase
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
              .eq('name', fallback.name)
              .eq('city', fallback.city)
              .eq('state', fallback.state)
              .eq('postal_code', fallback.postal_code || '')
              .maybeSingle();
            data = result.data;
            error = result.error;
            if (!data) {
              data = {
                ...fallback,
                address_line2: '',
                facility_licensing: [],
                facility_photos: [],
                facility_amenities: [],
                facility_care_types: []
              };
            }
          }
        }

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
        console.error('Error fetching facility from Supabase:', err);
        try {
          const index = await loadFacilityIndex();
          const fallback = index.find((item) => item.id === id);
          if (!fallback) throw err;
          setFacility({
            ...fallback,
            address_line2: '',
            facility_licensing: [],
            facility_photos: [],
            facility_amenities: [],
            facility_care_types: []
          });
          if (fallback.state) {
            setOmbudsman(getOmbudsman(fallback.state));
            setLicensingAuthority(getLicensingAuthority(fallback.state));
            setAgingAgency(getAgingAgency(fallback.state));
          }
        } catch (fallbackError) {
          console.error('Error loading static facility index:', fallbackError);
          setError('Failed to load facility details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [id]);

  const distanceMiles = useMemo(() => {
    if (!userCoords) return null;
    const lat = Number(facility?.latitude);
    const lng = Number(facility?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return getDistanceMiles(userCoords, { lat, lng });
  }, [userCoords, facility?.latitude, facility?.longitude]);

  const driveMinutes = useMemo(() => {
    if (!distanceMiles) return null;
    const mph = 30;
    return Math.max(5, Math.round((distanceMiles / mph) * 60));
  }, [distanceMiles]);

  const distanceLabel = distanceMiles
    ? `${distanceMiles.toFixed(1)} miles${driveMinutes ? ` (${driveMinutes} min)` : ''}`
    : userCoords
      ? 'Distance unavailable'
      : 'Enable location for distance';

  const mapUrl = useMemo(() => {
    if (!facility?.latitude || !facility?.longitude) return null;
    const destination = `${facility.latitude},${facility.longitude}`;
    const origin = userCoords ? `${userCoords.lat},${userCoords.lng}` : '';
    if (origin) {
      return `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    }
    return `https://www.google.com/maps/search/?api=1&query=${destination}`;
  }, [facility?.latitude, facility?.longitude, userCoords]);
  const qaEnabled = isUuid(facility?.id);
  const {
    questions: qaQuestions,
    loading: qaLoading,
    error: qaError,
    refetch: refetchQa,
  } = useFacilityQuestions(qaEnabled ? facility?.id || '' : '');
  const topQuestions = qaQuestions.slice(0, 3);
  const waitingCount = useMemo(
    () => qaQuestions.filter((q) => !q.answers.some((a) => a.is_operator)).length,
    [qaQuestions]
  );
  const isPremiumFacility = facility?.listing_tier && facility.listing_tier !== 'free';

  useEffect(() => {
    if (!FEATURE_FLAGS.qa_waiting_badges || waitingCount <= 0 || !facility?.id) return;
    if (typeof window === 'undefined') return;
    const key = `qa_waiting_badge_viewed_facility_${facility.id}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    trackEvent('qa_waiting_badge_viewed', { source: 'facility_header', facilityId: facility.id, waitingCount });
  }, [waitingCount, facility?.id]);

  useEffect(() => {
    setPhoneRevealed(false);
  }, [facility?.id]);

  useEffect(() => {
    if (!isUuid(facility?.id)) return;
    if (typeof window === 'undefined') return;
    const key = `lead_event_page_view_${facility.id}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    void trackLeadEvent(facility.id, 'page_view', { source: 'facility_details' });
  }, [facility?.id, trackLeadEvent]);

  const PricingCta = ({ className = '' }: { className?: string }) => (
    <div className="relative inline-flex group">
      <Button
        variant="primary"
        className={`bg-gold text-white hover:bg-gold-dark focus-visible:ring-gold/40 ${className}`}
        onClick={() => {
          if (pricingRequestLink) {
            window.location.href = pricingRequestLink;
          }
        }}
        disabled={!pricingRequestLink}
      >
        Request Transparent Pricing
      </Button>
      <div className="pointer-events-none absolute left-1/2 -translate-x-1/2 top-full mt-2 w-64 bg-charcoal text-white text-xs rounded-md px-3 py-2 opacity-0 group-hover:opacity-100 transition-opacity z-50">
        We'll contact this facility and ask them to share updated pricing for families.
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center max-w-md px-4">
          <div className="bg-white p-8 rounded-xl shadow-sm">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-charcoal mb-2">Facility Not Found</h2>
            <p className="text-charcoal/70 mb-6">
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

  const pricingMissing = !facility.min_price;
  const facilityEmail = facility.email || facility.contact_email || facility.contactEmail || null;
  const pricingRequestSubject = `Request for Transparent Pricing - ${facility.name}`;
  const pricingRequestBody = `Hello ${facility.name} team,%0D%0A%0D%0AI'm using SilverTech Directory to compare senior living options and would appreciate your most current pricing and care level ranges for ${facility.name} in ${facility.city}, ${facility.state}.%0D%0A%0D%0AIf you can share updated pricing, we can reflect it accurately for families researching your community.%0D%0A%0D%0AListing: ${encodeURIComponent(window.location.href)}%0D%0A%0D%0AThank you,%0D%0A`;
  const pricingRequestLink = facilityEmail
    ? `mailto:${facilityEmail}?subject=${encodeURIComponent(pricingRequestSubject)}&body=${pricingRequestBody}`
    : null;

  const defaultImage = `${window.location.origin}/hero.png`;
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
    image: facility.facility_photos?.[0]?.url || facility.image || defaultImage,
    priceRange: facility.min_price ? `$${facility.min_price} - $${facility.max_price}` : 'Pricing not publicly available',
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
  const regulatoryTopic = healthcareScore && ['D', 'F'].includes(healthcareScore.grade) ? 'inspections' : 'licensing';
  const regulatoryTopicUrl = `/states/${stateSlug}/regulations/${regulatoryTopic}`;
  const hasRegulatoryAlert = Boolean(healthcareScore && ['C', 'D', 'F'].includes(healthcareScore.grade));
  const canonicalUrl = `https://silvertechdirectory.com/facility/${id}`;
  const shareImage = facility.facility_photos?.[0]?.url || facility.image || defaultImage;
  const heroImage = shareImage;
  const pageTitle = `${facility.name} - ${serviceTypeString} in ${facility.city}, ${facility.state} | SilverTech`;
  const pageDescription = `Learn about ${facility.name}, a ${serviceTypeString} community in ${facility.city}, ${facility.state}. View pricing, photos, amenities, and licensing info (Lic: ${licenseNumber}). Capacity: ${capacity} beds.`;

  const tabs = [
    { label: 'Overview', href: '#overview' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Services', href: '#services' },
    { label: 'Map', href: '#map' },
    { label: 'Licensing', href: '#licensing' },
    { label: 'Reviews', href: '#reviews' },
    ...(qaEnabled ? [{ label: 'Q&A', href: '#qa' }] : [])
  ];

  return (
    <div className="min-h-screen bg-warm-gray pb-20">
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
      <div className="bg-warm-gray">
        <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-6">
          <Breadcrumbs items={[
            { label: 'Home', path: '/' },
            { label: 'Directory', path: '/search' },
            { label: facility.state, path: `/assisted-living/${stateSlug}` },
            { label: facility.city, path: `/assisted-living/${stateSlug}/cities/${citySlug}` },
            { label: facility.name }
          ]} />
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-8 pt-6" id="overview">
        <Card className="p-6 md:p-8">
          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-8 items-start">
            <div>
              <div className="flex flex-wrap gap-2 text-xs font-medium text-charcoal/60 uppercase tracking-wide">
                <span className="px-2 py-1 rounded-full bg-warm-gray border border-warm-gray">{serviceTypeString}</span>
                <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                  {facility.owner_id ? 'Premium Member' : 'Community Listing'}
                </span>
                {facility.owner_id && (
                  <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">Verified</span>
                )}
                {FEATURE_FLAGS.qa_waiting_badges && waitingCount > 0 && (
                  <span className="px-2 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                    {waitingCount} question{waitingCount === 1 ? '' : 's'} waiting for response
                  </span>
                )}
                {facility.website_url ? (
                  <span className="px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100">
                    Verified community
                  </span>
                ) : (
                  <span className="px-2 py-1 rounded-full bg-warm-gray text-charcoal/60 border border-warm-gray">
                    Website unavailable
                  </span>
                )}
              </div>

              <h1 className="text-[26px] md:text-[28px] font-semibold text-charcoal mt-3">
                {facility.name}
              </h1>

              <div className="flex flex-wrap items-center gap-2 text-sm text-charcoal/70 mt-2">
                <MapPin className="h-4 w-4 text-charcoal/40" />
                <span>
                  {facility.city}, {facility.state}
                </span>
                <span className="text-charcoal/30">|</span>
                <span>{fullAddress}</span>
              </div>

              <div className="mt-4 grid sm:grid-cols-2 gap-4">
                <div className="bg-warm-white border border-warm-gray rounded-lg px-4 py-3">
                  <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">Pricing</p>
                  <p className="text-[16px] font-semibold text-charcoal">
                    {facility.min_price ? `$${facility.min_price.toLocaleString()} - $${facility.max_price?.toLocaleString() || ''}` : 'Pricing not publicly available'}
                  </p>
                  {!facility.min_price && <PricingCta className="mt-2 w-full sm:w-auto text-sm" />}
                </div>
                <div className="bg-warm-white border border-warm-gray rounded-lg px-4 py-3">
                  <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">Distance</p>
                  <p className="text-[16px] font-semibold text-charcoal">
                    {distanceLabel}
                  </p>
                </div>
              </div>

              <div className={`mt-4 rounded-lg border px-4 py-3 ${hasRegulatoryAlert ? 'border-amber-300 bg-amber-50' : 'border-warm-gray bg-warm-white'}`}>
                <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">Regulatory snapshot</p>
                <p className="text-sm text-charcoal/70 mt-1">
                  {hasRegulatoryAlert && healthcareScore
                    ? `Healthcare access is currently graded ${healthcareScore.grade}. Review state oversight guidance before touring.`
                    : 'Review this state\'s licensing, complaint, and inspection guidance before making a decision.'}
                </p>
                <div className="mt-3">
                  <Button
                    variant="outline"
                    className="border-warm-gray hover:bg-warm-gray"
                    onClick={() => navigate(regulatoryTopicUrl)}
                  >
                    View regulation guide
                  </Button>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="outline"
                  className="border-warm-gray hover:bg-warm-gray"
                  onClick={() => {
                    if (isUuid(facility.id)) {
                      void trackLeadEvent(facility.id, 'comparison_added', { source: 'header' });
                    }
                    setIsCompareModalOpen(true);
                  }}
                >
                  Compare
                </Button>
                {mapUrl && (
                  <Button
                    variant="outline"
                    className="border-warm-gray hover:bg-warm-gray"
                    onClick={() => {
                      if (isUuid(facility.id)) {
                        void trackLeadEvent(facility.id, 'directions_clicked', { source: 'header', mapProvider: 'google_maps' });
                      }
                      window.open(mapUrl, '_blank');
                    }}
                  >
                    Directions
                  </Button>
                )}
              </div>

              {qaEnabled && (
                <div className="mt-5 border border-warm-gray rounded-lg bg-warm-white p-4">
                  <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">Top family questions</p>
                  {qaLoading ? (
                    <p className="mt-2 text-sm text-charcoal/70">Loading questions...</p>
                  ) : qaError ? (
                    <p className="mt-2 text-sm text-red-700">Unable to load questions right now.</p>
                  ) : topQuestions.length > 0 ? (
                    <ul className="mt-2 space-y-2">
                      {topQuestions.map((question) => (
                        <li key={question.id}>
                          <a
                            href={`#qa-${question.id}`}
                            className="text-sm text-charcoal hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
                          >
                            {question.question_text}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <a
                      href="#qa"
                      className="mt-2 inline-flex text-sm font-semibold text-primary-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 rounded"
                    >
                      Be the first to ask a question about {facility.name}.
                    </a>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-xl overflow-hidden border border-warm-gray shadow-sm">
              <img
                src={heroImage}
                alt={`${facility.name} hero`}
                className="w-full h-[260px] object-cover"
                loading="eager"
                decoding="async"
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
                  { label: 'Pricing', value: facility.min_price ? `$${facility.min_price.toLocaleString()} - $${facility.max_price?.toLocaleString() || ''}` : 'Pricing not publicly available' },
                  { label: 'Care types', value: careTypes.length ? careTypes.map((c: any) => c.name).join(', ') : serviceTypeString },
                  { label: 'Capacity', value: `${capacity} beds` },
                  { label: 'License', value: licenseNumber },
                  { label: 'Distance', value: distanceLabel },
                  { label: 'Rating', value: facility.rating ? `${facility.rating}/5` : 'Not yet rated' }
                ]}
              />
            </div>
          </Card>

          <Card>
            <SectionHeader title="Helping you decide" helper="Short, practical answers to the most important questions." />
            <div className="mt-6 grid md:grid-cols-2 gap-4">
              <div className="border border-warm-gray rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-charcoal">Best for</h3>
                <ul className="mt-3 text-sm text-charcoal/70 space-y-2">
                  <li>Families needing {serviceTypeString.toLowerCase()} in {facility.city}.</li>
                  <li>Residents who prefer a smaller community (capacity {capacity} beds).</li>
                  <li>Those prioritizing a licensed, regulated environment.</li>
                </ul>
              </div>
              <div className="border border-warm-gray rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-charcoal">Not ideal if</h3>
                <ul className="mt-3 text-sm text-charcoal/70 space-y-2">
                  <li>You need a lower monthly price than listed.</li>
                  <li>You are looking for a hospital-level medical setting.</li>
                </ul>
              </div>
              <div className="border border-warm-gray rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-charcoal">Cost clarity</h3>
                <ul className="mt-3 text-sm text-charcoal/70 space-y-2">
                  <li>Base pricing reflects standard care and housing.</li>
                  <li>Higher care needs can raise monthly costs.</li>
                </ul>
              </div>
              <div className="border border-warm-gray rounded-lg p-4">
                <h3 className="text-[16px] font-semibold text-charcoal">Safety snapshot</h3>
                <ul className="mt-3 text-sm text-charcoal/70 space-y-2">
                  <li>Licensed facility with ID: {licenseNumber}.</li>
                  <li>Regulated by state licensing authorities.</li>
                  <li>
                    View detailed rules in the{' '}
                    <Link to={regulatoryTopicUrl} className="text-primary-700 underline underline-offset-2">
                      state regulation guide
                    </Link>.
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card id="pricing">
            <SectionHeader title="Pricing" helper="Understand baseline pricing and what can change it." />
            <div className="mt-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-warm-gray rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">
                    {facility.min_price ? 'Starting range' : 'Pricing not publicly available'}
                  </p>
                  <p className="text-[16px] font-semibold text-charcoal mt-1">
                    {facility.min_price ? `$${facility.min_price.toLocaleString()} - $${facility.max_price?.toLocaleString() || ''}` : 'Request Transparent Pricing'}
                  </p>
                </div>
                <div className="border border-warm-gray rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">Includes</p>
                  <p className="text-sm text-charcoal/70 mt-1">Housing, meals, and baseline care services.</p>
                </div>
              </div>
              <div className="mt-4 text-sm text-charcoal/70">
                If pricing isn't published, request it directly and we'll ask the facility to share updated ranges for families.
              </div>
              <div className="mt-6 border border-warm-gray rounded-xl p-4 bg-warm-white">
                <p className="text-sm font-semibold text-charcoal">Our transparency pledge</p>
                <p className="text-sm text-charcoal/70 mt-1">
                  SilverTech never profits from your decision. We exist to help families compare care with confidence.
                </p>
                {!facility.min_price && <PricingCta className="mt-4 w-full sm:w-auto text-sm" />}
              </div>
            </div>
          </Card>

          <Card id="services">
            <SectionHeader title="Services & daily life" helper="What residents can expect on a daily basis." />
            <div className="mt-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-[16px] font-semibold text-charcoal mb-3">Care services</h3>
                  {careTypes.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {careTypes.map((care: any) => (
                        <span key={care.id} className="px-3 py-1 rounded-full bg-warm-gray text-charcoal text-sm border border-warm-gray">
                          {care.name}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-charcoal/70">Care types not listed yet.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-[16px] font-semibold text-charcoal mb-3">Amenities</h3>
                  {amenitiesList.length > 0 ? (
                    <div className="grid sm:grid-cols-2 gap-2 text-sm text-charcoal/70">
                      {amenitiesList.slice(0, 8).map((item: any) => (
                        <div key={item.id} className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-primary-500" />
                          <span>{item.name}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-charcoal/70">Amenities not listed yet.</p>
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
                <div className="border border-warm-gray rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">License number</p>
                  <p className="text-[16px] font-semibold text-charcoal mt-1">{licenseNumber}</p>
                </div>
                <div className="border border-warm-gray rounded-lg p-4">
                  <p className="text-[12px] uppercase tracking-wide text-charcoal/60 font-medium">Authority</p>
                  <p className="text-[16px] font-semibold text-charcoal mt-1">{licensingAuthority?.agency_name || 'State licensing authority'}</p>
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
              <Button
                variant="outline"
                className="border-warm-gray hover:bg-warm-gray"
                onClick={() => {
                  if (isUuid(facility.id)) {
                    void trackLeadEvent(facility.id, 'comparison_added', { source: 'comparison_section' });
                  }
                  setIsCompareModalOpen(true);
                }}
              >
                Compare similar homes
              </Button>
              <Button variant="outline" className="border-warm-gray hover:bg-warm-gray" onClick={() => navigate(`/assisted-living/${stateSlug}/cities/${citySlug}`)}>
                View all in {facility.city}
              </Button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Who this community is right for" helper="A quick mental shortcut to help with the decision." />
            <div className="mt-6 text-sm text-charcoal/70 space-y-2">
              <p>This community may be a good fit for families seeking {serviceTypeString.toLowerCase()} care in {facility.city} with a licensed setting.</p>
              <p>It is best for residents who value structured support and a community size of about {capacity} beds.</p>
            </div>
          </Card>

          <Card id="reviews">
            <SectionHeader title="Reviews" helper="Verified feedback and family impressions." />
            <div className="mt-6 flex justify-between items-center">
              <h3 className="text-[16px] font-semibold text-charcoal">Latest reviews</h3>
              {user ? (
                <Button
                  variant="outline"
                  onClick={() => setIsReviewModalOpen(true)}
                >
                  Write a Review
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate(`/login?redirect_to=${encodeURIComponent(`/facility/${facility.id}`)}`)}
                >
                  Log in to Review
                </Button>
              )}
            </div>
            <div className="mt-6">
      {isUuid(facility.id) ? (
        <ReviewList facilityId={facility.id} refreshTrigger={refreshReviews} />
      ) : (
        <p className="text-sm text-charcoal/60">Reviews are available once this listing is matched to a verified facility record.</p>
      )}
            </div>
          </Card>

          {isUuid(facility.id) && (
            <section id="qa">
              <FacilityQA
                facilityId={facility.id}
                facilityName={facility.name}
                questions={qaQuestions}
                loading={qaLoading}
                error={qaError}
                onRefresh={refetchQa}
                hasOwner={Boolean(facility.owner_id)}
                claimedAt={facility.claimed_at || null}
                isPremiumFacility={Boolean(isPremiumFacility)}
              />
            </section>
          )}

          <Card>
            <SectionHeader title="Next step" helper="When you're ready, take the next action." />
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  variant="primary"
                  className="w-full sm:w-auto"
                  onClick={() => {
                    trackEvent('lead_cta_clicked', { source: 'next_step', facilityId: facility.id });
                    if (isUuid(facility.id)) {
                      void trackLeadEvent(facility.id, 'schedule_tour', { source: 'next_step_cta' });
                    }
                    setIsLeadModalOpen(true);
                  }}
                >
                  Schedule a Tour
                </Button>
              {facility.phone && (
                phoneRevealed ? (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-warm-gray hover:bg-warm-gray"
                    onClick={() => window.location.href = `tel:${facility.phone}`}
                  >
                    Call {facility.phone}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full sm:w-auto border-warm-gray hover:bg-warm-gray"
                    onClick={() => {
                      if (isUuid(facility.id)) {
                        void trackLeadEvent(facility.id, 'phone_reveal', { source: 'next_step_cta' });
                      }
                      setPhoneRevealed(true);
                    }}
                  >
                    Show number ({maskPhoneNumber(facility.phone)})
                  </Button>
                )
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
                  if (isUuid(facility.id)) {
                    void trackLeadEvent(facility.id, 'schedule_tour', { source: 'sidebar_cta' });
                  }
                  setIsLeadModalOpen(true);
                }}
              >
                Schedule a Private Tour
              </Button>
              <Button
                variant="outline"
                className="w-full border-warm-gray hover:bg-warm-gray"
                onClick={() => {
                  if (isUuid(facility.id)) {
                    void trackLeadEvent(facility.id, 'comparison_added', { source: 'sidebar_cta' });
                  }
                  setIsCompareModalOpen(true);
                }}
              >
                Compare similar homes
              </Button>
              <Button
                variant="outline"
                className="w-full border-warm-gray hover:bg-warm-gray"
                onClick={() => navigate(`/assisted-living/${stateSlug}/cities/${citySlug}`)}
              >
                Back to {facility.city} list
              </Button>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Contact" />
            <div className="mt-4 space-y-3 text-sm text-charcoal/70">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-charcoal/40" />
                <span>{fullAddress}</span>
              </div>
              {facility.phone && (
                phoneRevealed ? (
                  <a
                    href={`tel:${facility.phone}`}
                    className="inline-flex items-center gap-2 text-charcoal hover:text-charcoal"
                  >
                    <Phone className="w-4 h-4" />
                    {facility.phone}
                  </a>
                ) : (
                  <button
                    type="button"
                    className="inline-flex items-center gap-2 text-charcoal hover:text-charcoal"
                    onClick={() => {
                      if (isUuid(facility.id)) {
                        void trackLeadEvent(facility.id, 'phone_reveal', { source: 'sidebar_contact' });
                      }
                      setPhoneRevealed(true);
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    Show number ({maskPhoneNumber(facility.phone)})
                  </button>
                )
              )}
              {facility.website_url ? (
                <div className="flex flex-wrap items-center gap-2">
                  <a
                    href={facility.website_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-charcoal hover:text-charcoal"
                  >
                    Visit facility website
                  </a>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary-50 text-primary-700 border border-primary-100 px-2 py-1 text-xs uppercase tracking-widest">
                    Verified community
                  </span>
                </div>
              ) : (
                <span className="text-sm text-charcoal/60">Website unavailable</span>
              )}
              {facility.google_maps_url && (
                <a
                  href={facility.google_maps_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 text-charcoal hover:text-charcoal"
                  onClick={() => {
                    if (isUuid(facility.id)) {
                      void trackLeadEvent(facility.id, 'directions_clicked', { source: 'sidebar_google_maps_link' });
                    }
                  }}
                >
                  View on Google Maps
                </a>
              )}
            </div>
          </Card>

          <Card>
            <SectionHeader title="Monthly cost" />
            <div className="mt-4">
              <div className="flex items-center gap-2 text-charcoal">
                <DollarSign className="h-6 w-6 text-charcoal" />
                {facility.min_price ? (
                  <span className="text-[22px] font-semibold">
                    ${facility.min_price.toLocaleString()}
                  </span>
                ) : (
                  <PricingCta className="text-sm px-3 py-2" />
                )}
                {facility.max_price && <span className="text-sm text-charcoal/60">- ${facility.max_price.toLocaleString()}</span>}
              </div>
              <div className="mt-3 text-sm text-primary-700 bg-primary-50 border border-primary-100 rounded-full px-3 py-1 inline-flex items-center gap-2">
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

      {isUuid(facility.id) && (
        <LeadModal
          isOpen={isLeadModalOpen}
          onClose={() => setIsLeadModalOpen(false)}
          facilityId={facility.id}
          facilityName={facility.name}
        />
      )}

      <CompareToolModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        baseFacility={facility}
      />
    </div>
  );
};
