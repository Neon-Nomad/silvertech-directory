
import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, ExternalLink, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { loadFacilityIndex, resolveSlug } from '@/src/utils/facilityIndex';
import { geocodeAddress } from '@/src/utils/geocoding';
import { calculateHealthcareScore, HealthcareScore } from '@/src/utils/hospitalData';
import { ALL_STATES } from '@/src/data/states';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { useFacilityQuestions } from '@/src/hooks/useFacilityQuestions';
import { trackEvent } from '@/src/utils/analytics';
import { useLeadTracking } from '@/src/hooks/useLeadTracking';
import { buildFacilityCanonicalUrl, buildFacilityDetailPath } from '@/src/utils/facilityPath';

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

const titleize = (value: string) =>
  value
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');

const safeJson = (value: unknown): Record<string, any> | null => {
  if (!value) return null;
  if (typeof value === 'object') return value as Record<string, any>;
  if (typeof value !== 'string') return null;
  try {
    return JSON.parse(value) as Record<string, any>;
  } catch {
    return null;
  }
};

const monthYear = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
};

export const FacilityDetails: React.FC = () => {
  const { id, state: routeState, city: routeCity, leaf } = useParams<{
    id?: string;
    state?: string;
    city?: string;
    leaf?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();
  const routeFacilityId = leaf || id || '';
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resolvedSlug, setResolvedSlug] = useState<string | null>(null);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const [healthcareScore, setHealthcareScore] = useState<HealthcareScore | null>(null);
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
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
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
      if (!routeFacilityId) return;
      setLoading(true);
      setError(null);

      try {
        const facilitySelect = `
          *,
          facility_licensing(*),
          facility_photos(*),
          facility_amenities(
            amenities(*)
          ),
          facility_care_types(
            care_types(*)
          )
        `;

        let data = null;
        let queryError = null;

        if (isUuid(routeFacilityId)) {
          const result = await supabase.from('facilities').select(facilitySelect).eq('id', routeFacilityId).single();
          data = result.data;
          queryError = result.error;
        } else {
          const index = await loadFacilityIndex();
          const fallback = index.find((item) => item.id === routeFacilityId);

          if (fallback) {
            const strictResult = await supabase
              .from('facilities')
              .select(facilitySelect)
              .eq('name', fallback.name)
              .eq('city', fallback.city)
              .eq('state', fallback.state)
              .eq('postal_code', fallback.postal_code || '')
              .maybeSingle();

            data = strictResult.data;
            queryError = strictResult.error;

            if (!data && !queryError) {
              const relaxedResult = await supabase
                .from('facilities')
                .select(facilitySelect)
                .eq('name', fallback.name)
                .eq('city', fallback.city)
                .eq('state', fallback.state)
                .limit(1);
              data = (relaxedResult.data || [])[0] || null;
              queryError = relaxedResult.error;
            }

            if (!data && !queryError) {
              const fuzzyResult = await supabase
                .from('facilities')
                .select(facilitySelect)
                .ilike('name', fallback.name)
                .eq('state', fallback.state)
                .limit(1);
              data = (fuzzyResult.data || [])[0] || null;
              queryError = fuzzyResult.error;
            }

            if (!data) {
              data = {
                ...fallback,
                address_line2: '',
                facility_licensing: [],
                facility_photos: [],
                facility_amenities: [],
                facility_care_types: [],
              };
            }
          }
        }

        if (queryError) throw queryError;

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

        if (isUuid(routeFacilityId)) {
          const slug = await resolveSlug(data);
          if (slug !== routeFacilityId) {
            setResolvedSlug(slug);
            navigate(buildFacilityDetailPath({ id: slug, state: data.state, city: data.city }), { replace: true });
            return;
          }
        }

        const canonicalPath = buildFacilityDetailPath({
          id: data.id || routeFacilityId,
          state: data.state || routeState,
          city: data.city || routeCity,
        });
        const normalizedCurrentPath = location.pathname.replace(/\/+$/, '') || '/';
        const normalizedCanonicalPath = canonicalPath.replace(/\/+$/, '') || '/';
        if (normalizedCurrentPath !== normalizedCanonicalPath) {
          navigate(canonicalPath, { replace: true });
          return;
        }

        if (data.latitude && data.longitude && data.state) {
          try {
            const score = await calculateHealthcareScore(data.latitude, data.longitude, data.state, data.city);
            setHealthcareScore(score);
          } catch (scoreError) {
            console.error('Error calculating healthcare score:', scoreError);
          }
        }
      } catch (fetchError) {
        console.error('Error fetching facility from Supabase:', fetchError);
        try {
          const index = await loadFacilityIndex();
          const fallback = index.find((item) => item.id === routeFacilityId);
          if (!fallback) throw fetchError;
          setFacility({
            ...fallback,
            address_line2: '',
            facility_licensing: [],
            facility_photos: [],
            facility_amenities: [],
            facility_care_types: [],
          });
        } catch (fallbackError) {
          console.error('Error loading static facility index:', fallbackError);
          setError('Failed to load facility details.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchFacility();
  }, [location.pathname, navigate, routeCity, routeFacilityId, routeState]);

  useEffect(() => {
    setPhoneRevealed(false);
  }, [facility?.id]);

  useEffect(() => {
    if (!isUuid(facility?.id)) return;
    if (typeof window === 'undefined') return;
    const key = `lead_event_page_view_${facility.id}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    void trackLeadEvent(facility.id, 'page_view', { source: 'facility_profile' });
  }, [facility?.id, trackLeadEvent]);

  const distanceMiles = useMemo(() => {
    if (!userCoords) return null;
    const lat = Number(facility?.latitude);
    const lng = Number(facility?.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return getDistanceMiles(userCoords, { lat, lng });
  }, [facility?.latitude, facility?.longitude, userCoords]);

  const distanceLabel = distanceMiles
    ? `${distanceMiles.toFixed(1)} miles away`
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
  const { questions: qaQuestions, loading: qaLoading, error: qaError } = useFacilityQuestions(
    qaEnabled ? facility?.id || '' : ''
  );
  const topQuestions = qaQuestions.slice(0, 6);
  const waitingCount = useMemo(
    () => qaQuestions.filter((q) => !q.answers.some((a) => a.is_operator)).length,
    [qaQuestions]
  );

  useEffect(() => {
    if (!FEATURE_FLAGS.qa_waiting_badges || waitingCount <= 0 || !facility?.id) return;
    if (typeof window === 'undefined') return;
    const key = `qa_waiting_badge_viewed_facility_${facility.id}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    trackEvent('qa_waiting_badge_viewed', { source: 'facility_profile', facilityId: facility.id, waitingCount });
  }, [facility?.id, waitingCount]);

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
              We could not find the facility you are looking for. It may have been removed or the link is incorrect.
            </p>
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse All Facilities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const fullAddress = `${facility.address_line1}${facility.address_line2 ? `, ${facility.address_line2}` : ''}, ${facility.city}, ${facility.state}${facility.postal_code ? ` ${facility.postal_code}` : ''}`;
  const license = facility.facility_licensing?.[0];
  const capacity = Number(license?.bed_capacity || facility.bed_capacity || 0);
  const licenseNumber = license?.license_number || facility.state_license_number || 'Pending';
  const canonicalPayload = safeJson(facility.canonical_payload);
  const cmsProviderId =
    facility.cms_provider_id ||
    facility.cms_certification_number ||
    facility.cms_certified_number ||
    license?.cms_provider_id ||
    canonicalPayload?.cms_provider_id ||
    'Pending';
  const ownershipType =
    facility.ownership_type || canonicalPayload?.ownership_type || canonicalPayload?.ownership || 'Not reported';
  const qualityRating = healthcareScore?.grade || canonicalPayload?.overall_rating || facility.overall_rating || 'N/A';
  const violations =
    facility.violations_2024 ??
    facility.total_violations ??
    facility.violation_count ??
    canonicalPayload?.violations_2024 ??
    canonicalPayload?.total_violations ??
    0;

  const careTypes = (facility.facility_care_types || []).map((item: any) => item.care_types).filter(Boolean);
  const careTypeNames = careTypes.map((care: any) => care.name).filter(Boolean);
  const primaryCare = careTypeNames[0] || 'Senior Living';
  const careTypeSlug = careTypes[0]?.slug || 'assisted-living';

  const stateSlug = ALL_STATES.find((state) => state.abbreviation === facility.state)?.slug || facility.state.toLowerCase();
  const citySlug = facility.city.toLowerCase().replace(/\s+/g, '-');
  const cityCareUrl = `/senior-living/${stateSlug}/${citySlug}/${careTypeSlug}/`;

  const websiteUrl = facility.website_url || facility.website || null;
  const facilityEmail = facility.email || facility.contact_email || facility.contactEmail || null;
  const listingUrl =
    typeof window !== 'undefined'
      ? window.location.href
      : buildFacilityCanonicalUrl({
          id: routeFacilityId,
          state: facility?.state || routeState,
          city: facility?.city || routeCity,
        });
  const pricingRequestSubject = `Request for Transparent Pricing - ${facility.name}`;
  const pricingRequestBody = `Hello ${facility.name} team,%0D%0A%0D%0AI am comparing care options and would appreciate your latest pricing range and care-level details for ${facility.name} in ${facility.city}, ${facility.state}.%0D%0A%0D%0AListing: ${encodeURIComponent(listingUrl)}%0D%0A%0D%0AThank you.%0D%0A`;
  const pricingRequestLink = facilityEmail
    ? `mailto:${facilityEmail}?subject=${encodeURIComponent(pricingRequestSubject)}&body=${pricingRequestBody}`
    : null;
  const monthlyPrice =
    facility.min_price && facility.max_price
      ? `$${Number(facility.min_price).toLocaleString()} - $${Number(facility.max_price).toLocaleString()}`
      : facility.min_price
        ? `From $${Number(facility.min_price).toLocaleString()}`
        : null;

  const isUuidUrl = isUuid(routeFacilityId);
  const canonicalSlug = isUuidUrl ? resolvedSlug : routeFacilityId;
  const canonicalUrl = canonicalSlug
    ? buildFacilityCanonicalUrl({
        id: canonicalSlug,
        state: facility.state || routeState,
        city: facility.city || routeCity,
      })
    : null;

  const defaultImage = `${typeof window !== 'undefined' ? window.location.origin : 'https://silvertechdirectory.com'}/hero.png`;
  const photoUrls = [
    ...(facility.facility_photos || []).map((photo: any) => photo.url).filter(Boolean),
    facility.image,
  ].filter(Boolean);
  const uniquePhotoUrls = Array.from(new Set(photoUrls));
  const gallery = uniquePhotoUrls.length > 0 ? uniquePhotoUrls.slice(0, 3) : [defaultImage, defaultImage, defaultImage];
  while (gallery.length < 3) {
    gallery.push(gallery[0] || defaultImage);
  }

  const shareImage = gallery[0] || defaultImage;
  const lastUpdatedRaw = license?.updated_at || facility.updated_at || facility.created_at || null;
  const pageTitle = `${facility.name} | SilverTech Digital Credential`;
  const pageDescription = `View verified profile details for ${facility.name} in ${facility.city}, ${facility.state}. License ${licenseNumber}, care type ${primaryCare}, and regulatory snapshot.`;
  const cmsBadge = monthYear(
    facility.cms_verified_at || canonicalPayload?.cms_verified_at || canonicalPayload?.medicare_certified_date
  );
  const cmsVerificationLabel = cmsBadge || 'PENDING';
  const numericViolations = Number(violations);
  const violationsCount = Number.isFinite(numericViolations) ? numericViolations : null;
  const violationsValueClass = violationsCount === 0 ? 'text-green-700' : 'text-slate-700';

  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: facility.name,
    identifier: licenseNumber !== 'Pending' ? licenseNumber : undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: facility.address_line1,
      addressLocality: facility.city,
      addressRegion: facility.state,
      postalCode: facility.postal_code,
      addressCountry: 'US',
    },
    telephone: facility.phone || undefined,
    image: shareImage,
    url: canonicalUrl || undefined,
    description: pageDescription,
    sameAs: websiteUrl || undefined,
    geo:
      facility.latitude && facility.longitude
        ? {
            '@type': 'GeoCoordinates',
            latitude: facility.latitude,
            longitude: facility.longitude,
          }
        : undefined,
    dateModified: lastUpdatedRaw || undefined,
  };

  const showClaimBar = isUuid(facility.id) && !facility.owner_id;

  return (
    <div className="min-h-screen bg-[#f2f2f1] text-charcoal pb-28">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        {isUuidUrl && <meta name="robots" content="noindex, follow" />}
        {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        {canonicalUrl && <meta property="og:url" content={canonicalUrl} />}
        <meta property="og:image" content={shareImage} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={shareImage} />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
      </Helmet>

      <header className="border-b border-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.24em] text-charcoal/60">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to={`/senior-living/${stateSlug}/`} className="hover:text-charcoal">
                  {facility.state}
                </Link>
              </li>
              <li className="text-charcoal/30">/</li>
              <li>
                <Link to={`/senior-living/${stateSlug}/${citySlug}/`} className="hover:text-charcoal">
                  {facility.city}
                </Link>
              </li>
              <li className="text-charcoal/30">/</li>
              <li>
                <Link to={cityCareUrl} className="text-gold hover:text-gold-dark">
                  {titleize(careTypeSlug)}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="mt-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-bold">{facility.name}</h1>
              <p className="mt-3 text-sm font-semibold text-green-700 uppercase tracking-wide">
                ✓ Verified Facility • CMS Verified: {cmsVerificationLabel}
              </p>
            </div>

            <div className="lg:text-right">
              {websiteUrl ? (
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-charcoal text-white px-6 py-3 rounded-sm font-semibold hover:bg-black transition-colors"
                  onClick={() => {
                    trackEvent('facility_website_clicked', { source: 'profile_header', facilityId: facility.id });
                    if (isUuid(facility.id)) {
                      void trackLeadEvent(facility.id, 'page_view', { source: 'profile_header_website_click' });
                    }
                  }}
                >
                  Official Website
                  <ExternalLink className="h-4 w-4 text-gold" />
                </a>
              ) : (
                <span className="inline-flex items-center bg-white border border-black/10 text-charcoal/60 px-6 py-3 rounded-sm font-semibold">
                  Website unavailable
                </span>
              )}
              <p className="mt-2 text-[10px] uppercase tracking-[0.15em] text-charcoal/40">
                External link redirects to government-registered domain.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-14">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-md overflow-hidden border border-black/10 shadow-sm">
              <div className="relative md:row-span-2 h-72 md:h-full">
                <img src={gallery[0]} alt={`${facility.name} exterior`} className="w-full h-full object-cover" loading="eager" />
                <span className="absolute top-4 left-4 bg-black/70 text-white uppercase text-[10px] tracking-[0.18em] font-bold px-3 py-1 border-l-2 border-gold">
                  Official Photo
                </span>
              </div>
              <div className="relative h-52">
                <img src={gallery[1]} alt={`${facility.name} interior`} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-4 left-4 bg-black/70 text-white uppercase text-[10px] tracking-[0.18em] font-bold px-3 py-1 border-l-2 border-gold">
                  Official Photo
                </span>
              </div>
              <div className="relative h-52">
                <img src={gallery[2]} alt={`${facility.name} family view`} className="w-full h-full object-cover" loading="lazy" />
                <span className="absolute top-4 left-4 bg-black/70 text-white uppercase text-[10px] tracking-[0.18em] font-bold px-3 py-1 border-l-2 border-blue-400">
                  Family Perspective
                </span>
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5 space-y-6">
            <div className="relative overflow-hidden bg-slate-950 text-white p-8 rounded-sm shadow-2xl min-h-[360px]">
              <div className="absolute -right-14 -top-14 w-60 h-60 rounded-full bg-gold/15"></div>
              <h2 className="relative z-10 text-gold text-xs font-semibold uppercase tracking-[0.2em] border-b border-white/15 pb-4 mb-6">
                Digital Credential File
              </h2>
              <div className="relative z-10 space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">State License Number</p>
                  <p className="mt-1 text-2xl font-mono tracking-wide">{licenseNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">CMS Provider ID</p>
                  <p className="mt-1 text-2xl font-mono tracking-wide">{cmsProviderId}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/15">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Ownership Type</p>
                    <p className="mt-1 text-sm font-medium">{ownershipType}</p>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Authorized Capacity</p>
                    <p className="mt-1 text-sm font-medium">{capacity > 0 ? `${capacity} Beds` : 'Not reported'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-sm p-6 min-h-[220px]">
              <h3 className="text-2xl font-bold">Inspection Readiness</h3>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="border border-black/10 rounded-sm text-center py-4">
                  <p className="text-4xl font-bold text-gold">{String(qualityRating)}</p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-charcoal/60">Quality Rating</p>
                </div>
                <div className="border border-black/10 rounded-sm text-center py-4">
                  <p className={`text-4xl font-bold ${violationsValueClass}`}>
                    {violationsCount ?? 'N/A'}
                  </p>
                  <p className="text-[11px] uppercase tracking-[0.14em] text-charcoal/60">Recent Violations</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-sm p-6 space-y-4">
              <h3 className="text-2xl font-bold">Profile Snapshot</h3>

              <div className="space-y-2 text-sm text-charcoal/80">
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-charcoal/50" />
                  <span>{fullAddress}</span>
                </p>
                <p>Care Type: {careTypeNames.length ? careTypeNames.join(', ') : primaryCare}</p>
                <p>Distance: {distanceLabel}</p>
                {monthlyPrice ? (
                  <p>Monthly Price: {monthlyPrice}</p>
                ) : pricingRequestLink ? (
                  <a
                    href={pricingRequestLink}
                    className="inline-flex text-sm font-semibold text-gold hover:underline"
                    onClick={() => trackEvent('pricing_request_clicked', { source: 'facility_profile', facilityId: facility.id })}
                  >
                    Request Transparent Pricing
                  </a>
                ) : (
                  <p>Pricing: Not publicly available</p>
                )}
              </div>

              <div className="flex flex-wrap gap-3 pt-1">
                {facility.phone &&
                  (phoneRevealed ? (
                    <a
                      href={`tel:${facility.phone}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-black/10 bg-white hover:bg-warm-gray text-sm font-medium"
                    >
                      <Phone className="h-4 w-4" />
                      {facility.phone}
                    </a>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-black/10 bg-white hover:bg-warm-gray text-sm font-medium"
                      onClick={() => {
                        setPhoneRevealed(true);
                        if (isUuid(facility.id)) {
                          void trackLeadEvent(facility.id, 'phone_reveal', { source: 'facility_profile' });
                        }
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      Show number ({maskPhoneNumber(facility.phone)})
                    </button>
                  ))}

                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-black/10 bg-white hover:bg-warm-gray text-sm font-medium"
                    onClick={() => {
                      if (isUuid(facility.id)) {
                        void trackLeadEvent(facility.id, 'directions_clicked', { source: 'facility_profile' });
                      }
                    }}
                  >
                    Directions
                  </a>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section id="knowledge-base" className="space-y-8">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="text-4xl font-bold">Facility Knowledge Base</h2>
            <span className="text-sm font-semibold text-gold uppercase tracking-[0.08em]">
              {qaQuestions.length > 0 ? `View all ${qaQuestions.length} Q&As` : 'Q&A coming soon'}
            </span>
          </div>

          {qaLoading && <p className="text-charcoal/70">Loading facility Q&A...</p>}
          {qaError && <p className="text-red-700">Unable to load Q&A right now.</p>}

          {!qaLoading && !qaError && topQuestions.length === 0 && (
            <div className="bg-white border border-black/10 p-6 rounded-sm">
              <p className="text-charcoal/70">
                No published questions yet. As family questions are submitted and verified, they will appear here.
              </p>
            </div>
          )}

          {!qaLoading && !qaError && topQuestions.map((question) => {
            const primaryAnswer = question.answers.find((answer) => answer.is_operator) || question.answers[0] || null;

            return (
              <article
                key={question.id}
                id={`qa-${question.id}`}
                className={`rounded-sm border p-6 ${primaryAnswer ? 'bg-white border-gold/40' : 'bg-warm-white border-black/10'}`}
              >
                <div className="flex items-start gap-4">
                  <span className="h-10 w-10 shrink-0 rounded-full border border-black/10 bg-white text-sm font-semibold inline-flex items-center justify-center">
                    Q
                  </span>
                  <div className="flex-1">
                    <p className="text-xl italic font-semibold">"{question.question_text}"</p>

                    {primaryAnswer ? (
                      <div className="mt-5 bg-gold/10 border border-gold/25 rounded-sm p-5">
                        <p className="text-[11px] uppercase tracking-[0.14em] font-semibold text-gold mb-2">
                          {primaryAnswer.is_operator ? 'Verified Response' : 'Community Response'}
                        </p>
                        <p className="text-charcoal/85 leading-relaxed">{primaryAnswer.answer_text}</p>
                      </div>
                    ) : (
                      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.12em] text-gold">
                        Awaiting official update - response pending
                      </p>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      {showClaimBar && (
        <footer className="fixed bottom-0 left-0 right-0 bg-charcoal border-t border-gold/30 shadow-[0_-12px_36px_rgba(0,0,0,0.28)] z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-10 h-10 rounded-full bg-gold text-white inline-flex items-center justify-center font-bold">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-white font-semibold text-sm">Own this facility?</p>
                <p className="text-white/70 text-xs">Claim your verified profile to manage photos and Q&A responses.</p>
              </div>
            </div>
            <Button
              variant="primary"
              className="bg-gold hover:bg-gold-dark text-white border-gold min-w-[180px]"
              onClick={() => {
                trackEvent('facility_claim_cta_clicked', { source: 'sticky_claim_bar', facilityId: facility.id });
                navigate(`/claim/${facility.id}`);
              }}
            >
              Claim Profile
            </Button>
          </div>
        </footer>
      )}
    </div>
  );
};

