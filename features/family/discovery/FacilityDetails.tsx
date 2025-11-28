import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, Phone, Star, DollarSign, CheckCircle, ArrowLeft, Shield, Users, Clock, Activity, Utensils, Wifi, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Map } from '@/components/ui/Map';
import { supabase } from '@/src/lib/supabase';
import { AddToCompareButton } from '@/components/ui/AddToCompareButton';
import { geocodeAddress } from '@/src/utils/geocoding';
import { ReviewList } from '@/features/reviews/ReviewList';
import { ReviewModal } from '@/features/reviews/ReviewModal';
import { useAuth } from '@/src/context/AuthProvider';

export const FacilityDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facility, setFacility] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);

  useEffect(() => {
    const fetchFacility = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('*, facility_licensing(*)')
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

        setFacility(data);
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

  // Mock amenities (since not in DB yet)
  const amenities = [
    { icon: <Clock className="w-5 h-5" />, label: "24/7 Staffing" },
    { icon: <Activity className="w-5 h-5" />, label: "Medication Management" },
    { icon: <Utensils className="w-5 h-5" />, label: "Restaurant-Style Dining" },
    { icon: <Users className="w-5 h-5" />, label: "Social Activities" },
    { icon: <Wifi className="w-5 h-5" />, label: "Wi-Fi Access" },
    { icon: <Shield className="w-5 h-5" />, label: "Secure Environment" }
  ];

  // Schema Markup
  const schemaMarkup = {
    "@context": "https://schema.org",
    "@type": "SeniorLivingCommunity", // More specific than LocalBusiness
    "name": facility.name,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": facility.address_line1,
      "addressLocality": facility.city,
      "addressRegion": facility.state,
      "postalCode": facility.postal_code,
      "addressCountry": "US"
    },
    "telephone": facility.phone,
    "image": facility.image || "https://silvertechdirectory.com/default-facility.jpg", // Fallback image
    "priceRange": "Call for Pricing",
    "description": `Assisted living facility in ${facility.city}, ${facility.state}. Licensed by ${license?.authority || 'State'}. Capacity: ${capacity} beds.`,
    "geo": facility.latitude && facility.longitude ? {
      "@type": "GeoCoordinates",
      "latitude": facility.latitude,
      "longitude": facility.longitude
    } : undefined,
    "url": window.location.href
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Helmet>
        <title>{`${facility.name} - Assisted Living in ${facility.city}, ${facility.state} | SilverTech`}</title>
        <meta name="description" content={`Learn about ${facility.name} in ${facility.city}, ${facility.state}. View pricing, photos, amenities, and licensing information. Capacity: ${capacity} residents.`} />
        <script type="application/ld+json">
          {JSON.stringify(schemaMarkup)}
        </script>
      </Helmet>

      {/* Hero Image */}
      <div className="h-[400px] w-full relative bg-slate-900">
        {facility.image ? (
          <img 
            src={facility.image} 
            alt={facility.name}
            className="w-full h-full object-cover opacity-60"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary-900 to-slate-800 opacity-90" />
        )}
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-end">
              <div>
                <Button 
                  variant="outline" 
                  className="mb-6 text-white border-white/30 hover:bg-white/10 hover:border-white"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back to Results
                </Button>
                
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 shadow-sm">{facility.name}</h1>
                
                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                    <MapPin className="h-5 w-5 text-primary-400" /> 
                    {fullAddress}
                  </span>
                  <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg backdrop-blur-sm border border-white/10">
                    <Shield className="h-5 w-5 text-primary-400" />
                    Lic: {licenseNumber}
                  </span>
                  <span className="flex items-center gap-1 bg-green-500/90 px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                    <CheckCircle className="h-4 w-4" /> Verified Provider
                  </span>
                </div>
              </div>
              <div className="hidden md:block">
                 <AddToCompareButton facility={facility} className="bg-white/10 text-white hover:bg-white/20 border border-white/30 rounded-lg px-4 py-2" />
              </div>
            </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-10">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Overview Card */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">About this Community</h2>
              <p className="text-slate-600 leading-relaxed text-lg">
                {facility.name} is a licensed residential care facility for the elderly (RCFE) located in {facility.city}, {facility.state}. 
                With a licensed capacity of {capacity} residents, this community offers personalized care services in a 
                supportive environment. Regulated by the {license?.authority || 'California Department of Social Services'}, 
                we are committed to maintaining high standards of safety and comfort for all residents.
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

            {/* Amenities */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Amenities & Services</h2>
              <div className="grid sm:grid-cols-2 gap-y-4 gap-x-8">
                {amenities.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-slate-700 p-2 hover:bg-slate-50 rounded-lg transition-colors">
                    <div className="text-primary-600 bg-primary-50 p-2 rounded-lg">
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Map Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100">
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

            {/* Reviews Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-slate-100" id="reviews">
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
            <div className="bg-white rounded-xl shadow-lg p-6 border border-primary-100 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-slate-500 font-medium">Monthly Cost</p>
                  <div className="flex items-center gap-1 text-primary-700">
                    <DollarSign className="h-6 w-6" />
                    <span className="text-3xl font-bold">Call</span>
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
                <Button variant="primary" className="w-full py-4 text-lg shadow-md hover:shadow-lg transition-all">
                  Check Availability
                </Button>
                <Button variant="outline" className="w-full py-4 text-lg border-2">
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
    </div>
  );
};
