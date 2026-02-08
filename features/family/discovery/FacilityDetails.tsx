import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Star, DollarSign, CheckCircle, ArrowLeft, Shield, Users, Clock, Activity, Utensils, Wifi, AlertCircle, Heart } from 'lucide-react';
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
  const pageTitle = `${facility.name} - ${serviceTypeString} in ${facility.city}, ${facility.state} | SilverTech`;
  const pageDescription = `Learn about ${facility.name}, a premier ${serviceTypeString} community in ${facility.city}, ${facility.state}. View pricing, photos, amenities, and licensing info (Lic: ${licenseNumber}). Capacity: ${capacity} beds.`;

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
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

        {/* Title Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">{facility.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-slate-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  <span>
                    {facility.address_line1}, <Link to={`/assisted-living/${stateSlug}/${citySlug}`} className="hover:text-primary-600 hover:underline">{facility.city}</Link>, <Link to={`/assisted-living/${stateSlug}`} className="hover:text-primary-600 hover:underline">{facility.state}</Link> {facility.postal_code}
                  </span>
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-4 w-4 text-slate-400" />
                  Lic: {licenseNumber}
                </span>
                {facility.owner_id && (
                  <span className="flex items-center gap-1 text-green-600 bg-green-50 px-2 py-0.5 rounded-full text-sm font-medium">
                    <CheckCircle className="h-3 w-3" /> Verified Provider
                  </span>
                )}
              </div>
            </div>
            <div className="hidden md:block">
              <AddToCompareButton facility={facility} />
            </div>
          </div>

          {/* Photo Gallery */}
          <PhotoGallery
            photos={facility.facility_photos || []}
            facilityName={facility.name}
          />
        </div>

        <ContentMeta />
        <div className="mt-3">
          <DataSourceNote note="Facility details are compiled from public records, licensing data, and verified submissions." />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">

            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About this Community</h2>
              <p className="text-slate-600 leading-relaxed text-lg whitespace-pre-line">
                {facility.description || `${facility.name} is a licensed residential care facility for the elderly (RCFE) located in ${facility.city}, ${facility.state}. With a licensed capacity of ${capacity} residents, this community offers personalized care services in a supportive environment.`}
              </p>

              <div className="mt-8 grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Capacity</p>
                  <p className="text-xl font-bold text-slate-900">{capacity} Beds</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">License Status</p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                    Active <CheckCircle className="w-4 h-4" />
                  </p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                  <p className="text-sm text-slate-500 font-medium uppercase tracking-wide">Facility Type</p>
                  <p className="text-xl font-bold text-slate-900">RCFE</p>
                </div>
              </div>
            </div>

            {/* Care Types */}
            {careTypes.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Care Services</h2>
                <div className="flex flex-wrap gap-3">
                  {careTypes.map((care: any) => (
                    <div key={care.id} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-lg border border-blue-100">
                      <Heart className="w-4 h-4" />
                      <span className="font-medium">{care.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Amenities */}
            {amenitiesList.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">Amenities & Features</h2>
                <div className="space-y-6">
                  {Object.entries(groupedAmenities).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-slate-800 mb-3 border-b border-slate-100 pb-2">{category}</h3>
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
              </div>
            )}

            {/* Map Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Location</h2>
              <div className="h-[400px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 relative">
                {facility.latitude && facility.longitude ? (
                  <Map
                    center={[facility.latitude, facility.longitude]}
                    facilities={[facility]}
                    zoom={15}
                  />
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
            </div>

            {/* Financial Resources - Veterans Benefits */}
            <div id="financial-help">
              <VeteransBenefitsList />
            </div>

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-200" id="reviews">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-900">Reviews</h2>
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
            </div>

          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing Card */}
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Monthly Cost</p>
                  <div className="flex items-center gap-1 text-primary-700">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-3xl font-bold">
                      {facility.min_price ? `$${facility.min_price.toLocaleString()}` : 'Call'}
                    </span>
                    {facility.max_price && <span className="text-sm text-slate-500 ml-1">- ${facility.max_price.toLocaleString()}</span>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-yellow-400 bg-yellow-50 px-2 py-1 rounded-lg border border-yellow-100">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-slate-900 font-bold">New</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  className="w-full py-4 text-lg shadow-md hover:shadow-lg transition-all"
                  onClick={() => setIsLeadModalOpen(true)}
                >
                  Check Availability
                </Button>
                <Button
                  variant="outline"
                  className="w-full py-4 text-lg border-2"
                  onClick={() => setIsLeadModalOpen(true)}
                >
                  Request Pricing
                </Button>
              </div>

              {facility.phone && (
                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <p className="text-sm text-slate-500 mb-2 font-medium">Speak with an Advisor</p>
                  <a href={`tel:${facility.phone}`} className="flex items-center justify-center gap-2 text-xl font-bold text-slate-900 hover:text-primary-600 transition-colors bg-slate-50 py-3 rounded-lg hover:bg-slate-100">
                    <Phone className="h-5 w-5" />
                    {facility.phone}
                  </a>
                </div>
              )}

              <div className="mt-4 text-xs text-center text-slate-400">
                100% Free Service for Families
              </div>
            </div>

            {/* Healthcare Score */}
            {healthcareScore && (
              <HealthcareScoreCard
                score={healthcareScore}
                nearestHospital={nearestHospital?.hospital || null}
                nearestDistance={nearestHospital?.distance || null}
              />
            )}

            {/* Ombudsman Card */}
            {ombudsman && (
              <OmbudsmanCard program={ombudsman} />
            )}

            {/* Licensing Authority Card */}
            {licensingAuthority && (
              <LicensingAuthorityCard authority={licensingAuthority} />
            )}

            {/* Aging Agency Card */}
            {agingAgency && (
              <AgingAgencyCard agency={agingAgency} variant="compact" />
            )}

            {/* Claim Business Card */}
            {!facility.owner_id && (
              <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 text-center">
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
          </div>
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
