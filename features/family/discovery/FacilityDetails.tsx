import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Star, DollarSign, CheckCircle, AlertCircle, Heart } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Map } from '@/components/ui/Map';
import { supabase } from '@/src/lib/supabase';
import { AddToCompareButton } from '@/components/ui/AddToCompareButton';
import { geocodeAddress } from '@/src/utils/geocoding';
import { ReviewList } from '@/features/reviews/ReviewList';
import { ReviewModal } from '@/features/reviews/ReviewModal';
import { useAuth } from '@/src/context/AuthProvider';
import { PhotoGallery } from '@/components/ui/PhotoGallery';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';
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

import { LeadModal } from '@/features/family/discovery/LeadModal';

export const FacilityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isLeadModalOpen, setIsLeadModalOpen] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [healthcareScore, setHealthcareScore] = useState<HealthcareScore | null>(null);
  const [nearestHospital, setNearestHospital] = useState<{ hospital: Hospital; distance: number } | null>(null);
  const [ombudsman, setOmbudsman] = useState<OmbudsmanProgram | null>(null);
  const [licensingAuthority, setLicensingAuthority] = useState<LicensingAuthority | null>(null);
  const [agingAgency, setAgingAgency] = useState<AgingAgency | null>(null);

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

        // Fallback for missing coordinates using Geocoding API
        if (!data.latitude || !data.longitude) {
          const fullAddress = `${data.address_line1}, ${data.city}, ${data.state}`;
          const coords = await geocodeAddress(fullAddress);

          if (coords) {
            data.latitude = coords.lat;
            data.longitude = coords.lng;
          }
        }

        // Sort photos by display_order
        if (data.facility_photos) {
          data.facility_photos.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0));
        }

        setFacility(data);

        // Calculate Healthcare Score if lat/lng exists
        if (data.latitude && data.longitude && data.state) {
          try {
            const score = await calculateHealthcareScore(data.latitude, data.longitude, data.state, data.city);
            setHealthcareScore(score);

            const nearest = await getNearestHospital(data.latitude, data.longitude, data.state, data.city);
            setNearestHospital(nearest);
          } catch (e) {
            console.error("Error calculating healthcare score:", e);
          }
        }

        // Fetch Ombudsman, Licensing, and Aging Agency
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

  // Construct address string
  const fullAddress = `${facility.address_line1}${facility.address_line2 ? ', ' + facility.address_line2 : ''}, ${facility.city}, ${facility.state} ${facility.postal_code}`;

  // Get licensing info
  const license = facility.facility_licensing?.[0];
  const capacity = license?.bed_capacity || 0;
  const licenseNumber = license?.license_number || 'Pending';

  // Process Amenities
  const amenitiesList = facility.facility_amenities?.map((fa: any) => fa.amenities) || [];
  const groupedAmenities: Record<string, any[]> = {};
  amenitiesList.forEach((amenity: any) => {
    if (!groupedAmenities[amenity.category]) {
      groupedAmenities[amenity.category] = [];
    }
    groupedAmenities[amenity.category].push(amenity);
  });

  // Process Care Types
  const careTypes = facility.facility_care_types?.map((fct: any) => fct.care_types) || [];

  // Check for Memory Care
  const hasMemoryCare = careTypes.some((c: any) => c.name.toLowerCase().includes('memory') || c.name.toLowerCase().includes('dementia'));
  const serviceTypeString = hasMemoryCare ? "Assisted Living & Memory Care" : "Assisted Living";

  // Schema Markup
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "SeniorLivingCommunity",
    "name": facility.name,
    "identifier": licenseNumber !== 'Pending' ? licenseNumber : undefined,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": facility.address_line1,
      "addressLocality": facility.city,
      "addressRegion": facility.state,
      "postalCode": facility.postal_code,
      "addressCountry": "US"
    },
    "telephone": facility.phone,
    "image": facility.facility_photos?.[0]?.url || facility.image || "https://silvertechdirectory.com/default-facility.jpg",
    "priceRange": facility.min_price ? `$${facility.min_price} - $${facility.max_price}` : "Call for Pricing",
    "description": facility.description || `${serviceTypeString} facility in ${facility.city}, ${facility.state}.`,
    "geo": facility.latitude && facility.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": facility.latitude,
      "longitude": facility.longitude
    } : undefined,
    "url": window.location.href
  };

  // ... inside component ...

  // Get state slug for links
  const stateSlug = ALL_STATES.find(s => s.abbreviation === facility.state)?.slug || facility.state.toLowerCase();
  const citySlug = facility.city.toLowerCase().replace(/ /g, '-');
  const canonicalUrl = `https://silvertechdirectory.com/facility/${id}`;
  const shareImage = facility.facility_photos?.[0]?.url || facility.image || "https://silvertechdirectory.com/hero.png";
  const heroImage = shareImage;
  const pageTitle = `${facility.name} - ${serviceTypeString} in ${facility.city}, ${facility.state} | SilverTech`;
  const pageDescription = `Learn about ${facility.name}, a premier ${serviceTypeString} community in ${facility.city}, ${facility.state}. View pricing, photos, amenities, and licensing info (Lic: ${licenseNumber}). Capacity: ${capacity} beds.`;

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
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      {/* Header / Breadcrumbs */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumbs items={[
            { label: 'Home', path: '/' },
            { label: 'Assisted Living', path: '/assisted-living' },
            { label: facility.state, path: `/assisted-living/${stateSlug}` },
            { label: facility.city, path: `/assisted-living/${stateSlug}/${citySlug}` },
            { label: facility.name }
          ]} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="relative">
            <img src={heroImage} alt={`${facility.name} hero`} className="w-full h-[360px] object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent" />
            <div className="absolute left-1/2 -bottom-10 transform -translate-x-1/2 bg-white rounded-2xl shadow-md border border-slate-200 px-6 py-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700">
                {facility.name?.charAt(0)}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-900">{facility.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500 font-medium uppercase">Senior Living</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                    {facility.owner_id ? 'Premium Member' : 'Community Listing'}
                  </span>
                  {facility.owner_id && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">
                      Verified
                    </span>
                  )}
                </div>
              </div>
              <div className="hidden md:block">
                <AddToCompareButton facility={facility} />
              </div>
            </div>
          </div>

          <div className="pt-14 px-6">
            <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-600 border-b border-slate-200">
              {[
                { label: 'Overview', href: '#overview' },
                { label: 'Photo Gallery', href: '#gallery' },
                { label: 'Amenities', href: '#amenities' },
                { label: 'Care Team', href: '#care-team' },
                { label: 'Reviews', href: '#reviews' },
                { label: 'Contact', href: '#contact' }
              ].map((tab) => (
                <a key={tab.label} href={tab.href} className="py-4 border-b-2 border-transparent hover:text-slate-900 hover:border-slate-300">
                  {tab.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-8 mt-8">
          <div className="lg:col-span-8 space-y-8">
            <section id="overview" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-semibold text-slate-900">Description</h2>
                <div className="flex items-center gap-3 text-sm text-slate-500">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {facility.address_line1}, <Link to={`/assisted-living/${stateSlug}/${citySlug}`} className="hover:text-primary-600">{facility.city}</Link>, <Link to={`/assisted-living/${stateSlug}`} className="hover:text-primary-600">{facility.state}</Link> {facility.postal_code}
                  </span>
                </div>
              </div>

              <p className="text-slate-600 leading-relaxed text-lg mt-4 whitespace-pre-line">
                {facility.description || `${facility.name} is a licensed residential care facility for the elderly (RCFE) located in ${facility.city}, ${facility.state}. With a licensed capacity of ${capacity} residents, this community offers personalized care services in a supportive environment.`}
              </p>

              <div className="mt-6 grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Capacity</p>
                  <p className="text-lg font-semibold text-slate-900">{capacity} Beds</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">License</p>
                  <p className="text-lg font-semibold text-slate-900">{licenseNumber}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">Care Type</p>
                  <p className="text-lg font-semibold text-slate-900">{serviceTypeString}</p>
                </div>
              </div>

              <ContentMeta />
              <div className="mt-3">
                <DataSourceNote note="Facility details are compiled from public records, licensing data, and verified submissions." />
              </div>
            </section>

            <section id="gallery" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Photo Gallery</h2>
              <PhotoGallery photos={facility.facility_photos || []} facilityName={facility.name} />
            </section>

            {amenitiesList.length > 0 && (
              <section id="amenities" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-semibold text-slate-900 mb-6">Amenities</h2>
                <div className="space-y-6">
                  {Object.entries(groupedAmenities).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-slate-800 mb-3">{category}</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {items.map((item: any) => (
                          <div key={item.id} className="flex items-center gap-3 text-slate-700">
                            <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{item.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            <section id="care-team" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-4">Care Team</h2>
              <p className="text-slate-600 leading-relaxed">
                Ask about staff training, care ratios, and specialty programs. We encourage families to request a tour and
                meet the team responsible for daily care and coordination.
              </p>
              {careTypes.length > 0 && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {careTypes.map((care: any) => (
                    <div key={care.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">{care.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section id="reviews" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-semibold text-slate-900">Reviews</h2>
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
              <ReviewList facilityId={id!} refreshTrigger={refreshReviews} />
            </section>

            <section id="contact" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-2xl font-semibold text-slate-900 mb-6">Contact & Location</h2>
              <div className="h-[360px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                {facility.latitude && facility.longitude ? (
                  <Map center={[facility.latitude, facility.longitude]} facilities={[facility]} zoom={15} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400">
                    Map data unavailable
                  </div>
                )}
              </div>
              <p className="mt-4 text-slate-600 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-slate-400" />
                {fullAddress}
              </p>
            </section>

            <div id="financial-help">
              <VeteransBenefitsList />
            </div>
          </div>

          <aside className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center">
              <div className="w-24 h-24 rounded-2xl bg-slate-100 mx-auto mb-4 flex items-center justify-center text-slate-500 font-semibold">
                Director
              </div>
              <p className="text-sm text-slate-500">Community Director</p>
              <p className="text-base font-semibold text-slate-900">Professional Director</p>
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => setIsLeadModalOpen(true)}
              >
                Schedule a Private Tour
              </Button>
              {facility.phone && (
                <a
                  href={`tel:${facility.phone}`}
                  className="mt-3 inline-flex items-center justify-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <Phone className="w-4 h-4" />
                  {facility.phone}
                </a>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Request Information</h3>
              <div className="space-y-3">
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="First Name" />
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Last Name" />
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Email Address" />
                <input className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" placeholder="Phone Number" />
              </div>
              <Button
                variant="primary"
                className="w-full mt-4"
                onClick={() => setIsLeadModalOpen(true)}
              >
                Request Information
              </Button>
              <p className="text-xs text-slate-400 mt-3">
                Your information is shared only with this facility.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <p className="text-sm text-slate-500 font-medium">Monthly Cost</p>
              <div className="flex items-center gap-2 text-slate-900 mt-2">
                <DollarSign className="h-6 w-6 text-slate-700" />
                <span className="text-2xl font-semibold">
                  {facility.min_price ? `$${facility.min_price.toLocaleString()}` : 'Call'}
                </span>
                {facility.max_price && <span className="text-sm text-slate-500">- ${facility.max_price.toLocaleString()}</span>}
              </div>
              <div className="mt-4 flex items-center gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">
                <Star className="h-4 w-4 fill-current" />
                Premium placement available
              </div>
            </div>

            {healthcareScore && (
              <HealthcareScoreCard
                score={healthcareScore}
                nearestHospital={nearestHospital?.hospital || null}
                nearestDistance={nearestHospital?.distance || null}
              />
            )}

            {ombudsman && <OmbudsmanCard program={ombudsman} />}
            {licensingAuthority && <LicensingAuthorityCard authority={licensingAuthority} />}
            {agingAgency && <AgingAgencyCard agency={agingAgency} variant="compact" />}

            {!facility.owner_id && (
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 text-center">
                <h3 className="font-semibold text-slate-900 mb-2">Own this facility?</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Claim your profile to update details, add photos, and respond to reviews.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-slate-300 hover:bg-white"
                  onClick={() => navigate(`/claim/${id}`)}
                >
                  Claim this Business
                </Button>
              </div>
            )}
          </aside>
        </div>
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
    </div>
  );
};
