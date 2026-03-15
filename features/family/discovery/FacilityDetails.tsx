import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { AlertCircle, ExternalLink, MapPin, Phone, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/src/lib/supabase';
import { ALL_STATES } from '@/src/data/states';
import { FEATURE_FLAGS } from '@/src/config/featureFlags';
import { useFacilityQuestions } from '@/src/hooks/useFacilityQuestions';
import { useLeadTracking } from '@/src/hooks/useLeadTracking';
import { trackEvent } from '@/src/utils/analytics';
import {
  buildCareTypePath,
  buildFacilityCanonicalUrl,
  getCareTypeRouteLabel,
  parseCommunityId,
} from '@/src/utils/facilityPath';

const maskPhoneNumber = (phone?: string | null) => {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 10) return phone;
  const area = digits.slice(0, 3);
  const prefix = digits.slice(3, 6);
  return `(${area}) ${prefix[0]}XX-XXXX`;
};

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

const toBoolean = (value: unknown): boolean => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    return normalized === 'true' || normalized === '1' || normalized === 'yes';
  }
  return false;
};

const monthYear = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).toUpperCase();
};

export const FacilityDetails: React.FC = () => {
  const { communityId } = useParams<{ communityId?: string }>();
  const navigate = useNavigate();
  const parsedCommunityId = useMemo(() => parseCommunityId(communityId), [communityId]);
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [phoneRevealed, setPhoneRevealed] = useState(false);
  const { trackLeadEvent } = useLeadTracking();

  useEffect(() => {
    let mounted = true;

    const fetchFacility = async () => {
      if (!parsedCommunityId) {
        setLoading(false);
        setError('Invalid community path.');
        return;
      }

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

        const { data, error: queryError } = await supabase
          .from('facilities')
          .select(facilitySelect)
          .eq('public_route_id', parsedCommunityId.publicRouteId)
          .maybeSingle();

        if (queryError) throw queryError;
        if (!data) throw new Error('Facility not found');

        const canonicalSlug = String(data.public_slug || '').trim().toLowerCase();
        if (!canonicalSlug || canonicalSlug !== parsedCommunityId.publicSlug) {
          throw new Error('Community slug mismatch');
        }

        const photos = Array.isArray(data.facility_photos) ? [...data.facility_photos] : [];
        photos.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));

        if (!mounted) return;
        setFacility({
          ...data,
          facility_photos: photos,
        });
      } catch (fetchError) {
        console.error('Error fetching facility:', fetchError);
        if (mounted) {
          setError('Facility not found.');
          setFacility(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void fetchFacility();
    return () => {
      mounted = false;
    };
  }, [parsedCommunityId]);

  useEffect(() => {
    setPhoneRevealed(false);
  }, [facility?.id]);

  useEffect(() => {
    if (!facility?.id) return;
    if (typeof window === 'undefined') return;
    const key = `lead_event_page_view_${facility.id}`;
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
    void trackLeadEvent(facility.id, 'page_view', { source: 'facility_profile' });
  }, [facility?.id, trackLeadEvent]);

  const qaEnabled = Boolean(facility?.id);
  const { questions: qaQuestions, loading: qaLoading, error: qaError } = useFacilityQuestions(
    qaEnabled ? facility.id : '',
  );
  const topQuestions = qaQuestions.slice(0, 6);
  const waitingCount = useMemo(
    () => qaQuestions.filter((q) => !q.answers.some((a) => a.is_operator)).length,
    [qaQuestions],
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <div className="text-center max-w-md px-4">
          <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-charcoal mb-2">Community Not Found</h2>
            <p className="text-charcoal/70 mb-6">
              The community URL is invalid or this listing is no longer available.
            </p>
            <Button variant="primary" onClick={() => navigate('/search')}>
              Browse All Communities
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const canonicalPayload = safeJson(facility.canonical_payload);
  const careTypes = (facility.facility_care_types || []).map((item: any) => item.care_types).filter(Boolean);
  const careTypeNames = careTypes.map((care: any) => care.name).filter(Boolean);
  const primaryCareTypeSlug =
    String(facility.primary_care_type_slug || '').trim().toLowerCase() ||
    String(careTypes[0]?.slug || '').trim().toLowerCase() ||
    'assisted-living';
  const primaryCareLabel = getCareTypeRouteLabel(primaryCareTypeSlug);
  const stateMeta = ALL_STATES.find((item) => item.abbreviation === facility.state);
  const stateSlug = stateMeta?.slug || String(facility.state || '').trim().toLowerCase();
  const citySlug = String(facility.city || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

  const stateCarePath = buildCareTypePath({ careType: primaryCareTypeSlug, state: stateSlug });
  const cityCarePath = buildCareTypePath({ careType: primaryCareTypeSlug, state: stateSlug, city: citySlug });
  const canonicalUrl = buildFacilityCanonicalUrl({
    publicSlug: facility.public_slug,
    publicRouteId: facility.public_route_id,
  });

  const photoUrls = [
    ...(facility.facility_photos || []).map((photo: any) => photo.url).filter(Boolean),
    facility.image,
  ].filter(Boolean);
  const uniquePhotoUrls = Array.from(new Set(photoUrls));
  const fallbackImage = `${typeof window !== 'undefined' ? window.location.origin : 'https://silvertechdirectory.com'}/hero.png`;
  const gallery = uniquePhotoUrls.length > 0 ? uniquePhotoUrls.slice(0, 3) : [fallbackImage, fallbackImage, fallbackImage];
  while (gallery.length < 3) gallery.push(gallery[0] || fallbackImage);

  const fullAddress = `${facility.address_line1 || ''}${facility.address_line2 ? `, ${facility.address_line2}` : ''}, ${facility.city}, ${facility.state}${facility.postal_code ? ` ${facility.postal_code}` : ''}`;
  const license = facility.facility_licensing?.[0];
  const licenseNumber = license?.license_number || facility.state_license_number || 'Pending';
  const websiteUrl = facility.website_url || facility.website || null;
  const facilityEmail = facility.email || facility.contact_email || null;
  const monthlyPrice =
    facility.min_price && facility.max_price
      ? `$${Number(facility.min_price).toLocaleString()} - $${Number(facility.max_price).toLocaleString()}`
      : facility.min_price
        ? `From $${Number(facility.min_price).toLocaleString()}`
        : null;
  const ownershipType = facility.ownership_type || canonicalPayload?.ownership_type || 'Not reported';
  const medicareCertified =
    toBoolean(canonicalPayload?.medicare_certified) ||
    Boolean(facility.cms_provider_id || facility.cms_certification_number || facility.cms_certified_number);
  const cmsBadge = monthYear(
    facility.cms_verified_at || canonicalPayload?.cms_verified_at || canonicalPayload?.medicare_certified_date,
  );
  const amenityNames = (facility.facility_amenities || [])
    .map((item: any) => item?.amenities?.name)
    .filter(Boolean)
    .slice(0, 8);
  const showClaimBar =
    typeof facility.id === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(facility.id) &&
    !facility.owner_id;

  const pageTitle = `${facility.name} | ${primaryCareLabel} in ${facility.city}, ${facility.state}`;
  const pageDescription = `View verified profile details for ${facility.name} in ${facility.city}, ${facility.state}. License ${licenseNumber}, care type ${primaryCareLabel}, and facility profile highlights.`;

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://silvertechdirectory.com/' },
      { '@type': 'ListItem', position: 2, name: primaryCareLabel, item: `https://silvertechdirectory.com${buildCareTypePath({ careType: primaryCareTypeSlug })}` },
      { '@type': 'ListItem', position: 3, name: stateMeta?.name || facility.state, item: `https://silvertechdirectory.com${stateCarePath}` },
      { '@type': 'ListItem', position: 4, name: facility.city, item: `https://silvertechdirectory.com${cityCarePath}` },
      { '@type': 'ListItem', position: 5, name: facility.name, item: canonicalUrl },
    ],
  };

  const schemaMarkup = {
    '@context': 'https://schema.org',
    '@type': 'MedicalBusiness',
    name: facility.name,
    identifier: licenseNumber !== 'Pending' ? licenseNumber : undefined,
    url: canonicalUrl,
    telephone: facility.phone || undefined,
    image: gallery[0],
    sameAs: websiteUrl || undefined,
    description: pageDescription,
    address: {
      '@type': 'PostalAddress',
      streetAddress: facility.address_line1 || undefined,
      addressLocality: facility.city || undefined,
      addressRegion: facility.state || undefined,
      postalCode: facility.postal_code || undefined,
      addressCountry: 'US',
    },
  };

  const pricingRequestSubject = `Request for Transparent Pricing - ${facility.name}`;
  const pricingRequestBody = `Hello ${facility.name} team,%0D%0A%0D%0AI am comparing care options and would appreciate your latest pricing range and care-level details for ${facility.name} in ${facility.city}, ${facility.state}.%0D%0A%0D%0AListing: ${encodeURIComponent(canonicalUrl)}%0D%0A%0D%0AThank you.%0D%0A`;
  const pricingRequestLink = facilityEmail
    ? `mailto:${facilityEmail}?subject=${encodeURIComponent(pricingRequestSubject)}&body=${pricingRequestBody}`
    : null;

  return (
    <div className="min-h-screen bg-[#f2f2f1] text-charcoal pb-28">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={gallery[0]} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content={gallery[0]} />
        <script type="application/ld+json">{JSON.stringify(schemaMarkup)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      </Helmet>

      <header className="border-b border-black/10 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <nav aria-label="Breadcrumb" className="text-xs uppercase tracking-[0.24em] text-charcoal/60">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link to={buildCareTypePath({ careType: primaryCareTypeSlug })} className="hover:text-charcoal">
                  {primaryCareLabel}
                </Link>
              </li>
              <li className="text-charcoal/30">/</li>
              <li>
                <Link to={stateCarePath} className="hover:text-charcoal">
                  {stateMeta?.name || facility.state}
                </Link>
              </li>
              <li className="text-charcoal/30">/</li>
              <li>
                <Link to={cityCarePath} className="hover:text-charcoal">
                  {facility.city}
                </Link>
              </li>
              <li className="text-charcoal/30">/</li>
              <li className="text-gold">{facility.name}</li>
            </ol>
          </nav>

          <div className="mt-5 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
            <div>
              <p className="text-sm font-semibold text-green-700 uppercase tracking-wide">
                Verified Community | Medicare: {medicareCertified ? 'Certified' : 'Not listed'}
                {cmsBadge ? ` | CMS Verified ${cmsBadge}` : ''}
              </p>
              <h1 className="mt-3 text-4xl md:text-6xl font-bold">{facility.name}</h1>
              <p className="mt-4 max-w-3xl text-base text-charcoal/70">
                {pageDescription}
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
                    void trackLeadEvent(facility.id, 'page_view', { source: 'profile_header_website_click' });
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
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 rounded-md overflow-hidden border border-black/10 shadow-sm bg-white">
              <div className="relative md:row-span-2 h-72 md:h-full">
                <img src={gallery[0]} alt={`${facility.name} exterior`} className="w-full h-full object-cover" loading="eager" />
              </div>
              <div className="h-52">
                <img src={gallery[1]} alt={`${facility.name} interior`} className="w-full h-full object-cover" loading="lazy" />
              </div>
              <div className="h-52">
                <img src={gallery[2]} alt={`${facility.name} community`} className="w-full h-full object-cover" loading="lazy" />
              </div>
            </div>
          </div>

          <aside className="lg:col-span-5 space-y-6">
            <div className="relative overflow-hidden bg-slate-950 text-white p-8 rounded-sm shadow-2xl">
              <h2 className="text-gold text-xs font-semibold uppercase tracking-[0.2em] border-b border-white/15 pb-4 mb-6">
                Credential Snapshot
              </h2>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">State License Number</p>
                  <p className="mt-1 text-2xl font-mono tracking-wide">{licenseNumber}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Primary Care Type</p>
                  <p className="mt-1 text-2xl font-mono tracking-wide">{primaryCareLabel.toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-white/55">Ownership Type</p>
                  <p className="mt-1 text-sm font-medium">{ownershipType}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-black/10 rounded-sm p-6">
              <h3 className="text-2xl font-bold">Profile Snapshot</h3>
              <div className="mt-4 space-y-3 text-sm text-charcoal/80">
                <p className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 mt-0.5 text-charcoal/50" />
                  <span>{fullAddress}</span>
                </p>
                <p>Care Types: {careTypeNames.length ? careTypeNames.join(', ') : primaryCareLabel}</p>
                <p>Monthly Price: {monthlyPrice || 'Not publicly available'}</p>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
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
                        void trackLeadEvent(facility.id, 'phone_reveal', { source: 'facility_profile' });
                      }}
                    >
                      <Phone className="h-4 w-4" />
                      Show number ({maskPhoneNumber(facility.phone)})
                    </button>
                  ))}

                {pricingRequestLink && (
                  <a
                    href={pricingRequestLink}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-black/10 bg-white hover:bg-warm-gray text-sm font-medium"
                    onClick={() => trackEvent('pricing_request_clicked', { source: 'facility_profile', facilityId: facility.id })}
                  >
                    Request pricing
                  </a>
                )}
              </div>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8">
          <div className="rounded-sm border border-black/10 bg-white p-8">
            <h2 className="text-3xl font-bold">Community Profile</h2>
            <p className="mt-4 text-charcoal/75 leading-relaxed">
              {facility.description || `${facility.name} is listed in our ${primaryCareLabel.toLowerCase()} directory for ${facility.city}, ${facility.state}. Review the profile snapshot, care types, and contact details before moving into outreach or tour scheduling.`}
            </p>

            {amenityNames.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold">Amenities</h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {amenityNames.map((amenity) => (
                    <span key={amenity} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm text-slate-700">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-sm border border-black/10 bg-white p-8">
            <h2 className="text-2xl font-bold">Breadcrumb Path</h2>
            <p className="mt-4 text-sm text-charcoal/70">
              Google-facing breadcrumb trail:
            </p>
            <p className="mt-3 text-sm font-medium text-charcoal">
              Home &gt; {primaryCareLabel} &gt; {stateMeta?.name || facility.state} &gt; {facility.city} &gt; {facility.name}
            </p>
            <div className="mt-6 space-y-2 text-sm">
              <Link to={stateCarePath} className="block text-primary-700 hover:underline">
                {primaryCareLabel} in {stateMeta?.name || facility.state}
              </Link>
              <Link to={cityCarePath} className="block text-primary-700 hover:underline">
                {primaryCareLabel} in {facility.city}
              </Link>
            </div>
          </div>
        </section>

        <section id="knowledge-base" className="space-y-8">
          <div className="flex items-center justify-between border-b border-black/10 pb-4">
            <h2 className="text-4xl font-bold">Community Q&A</h2>
            <span className="text-sm font-semibold text-gold uppercase tracking-[0.08em]">
              {qaQuestions.length > 0 ? `View all ${qaQuestions.length} Q&As` : 'Q&A coming soon'}
            </span>
          </div>

          {qaLoading && <p className="text-charcoal/70">Loading community Q&A...</p>}
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
                <p className="text-white font-semibold text-sm">Own this community?</p>
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
