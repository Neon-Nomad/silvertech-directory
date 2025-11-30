import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search,
  MapPin,
  DollarSign,
  Star,
  Filter,
  Phone,
  Loader2,
  Crosshair,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ReviewModal } from '../reviews/ReviewModal';
import { supabase } from '@/src/lib/supabase';
import { useGeolocation } from '@/src/hooks/useGeolocation';
import { AddToCompareButton } from '@/components/ui/AddToCompareButton';
import { ComparisonFacility } from '@/src/context/ComparisonContext';

type FacilityListItem = ComparisonFacility & {
  capacity: number;
  rating: number;
  vacancy: boolean;
  verified: boolean;
};

const DirectorySearch: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedFacilityName, setSelectedFacilityName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  const [facilities, setFacilities] = useState<FacilityListItem[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  const { loading: geoLoading, error: geoError, nearestCity, coordinates, getLocation } = useGeolocation();

  useEffect(() => {
    if (nearestCity) {
      setLocation(nearestCity);
    }
  }, [nearestCity]);

  useEffect(() => {
    const fetchFacilities = async () => {
      setDataLoading(true);
      try {
        let data;
        let error;

        // If we have coordinates and no specific text search (or if the user just clicked "Use My Location"), use RPC
        // We prioritize the RPC if coordinates are available and match the current location intent
        // But if the user types a different city, we should use that.
        // Let's use RPC if coordinates are present AND location matches nearestCity (implies "Use My Location" was used)

        if (coordinates && location === nearestCity && !searchQuery) {
          const { data: rpcData, error: rpcError } = await supabase
            .rpc('get_nearby_facilities', {
              user_lat: coordinates.lat,
              user_lng: coordinates.lng,
              max_results: 50
            });

          if (rpcData) {
            const ids = rpcData.map((f: any) => f.id);
            const { data: licenseData } = await supabase
              .from('facility_licensing')
              .select('*')
              .in('facility_id', ids);

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

          if (searchQuery) {
            query = query.ilike('name', `%${searchQuery}%`);
          }

          if (location) {
            if (/^\d{5}$/.test(location)) {
              query = query.eq('postal_code', location);
            } else {
              query = query.ilike('city', `%${location}%`);
            }
          }

          // Pagination
          const from = (currentPage - 1) * itemsPerPage;
          const to = from + itemsPerPage - 1;
          query = query.range(from, to);

          const result = await query;
          data = result.data;
          error = result.error;
        }

        if (error) {
          console.error('Error fetching facilities:', error);
        } else if (data) {
          // Map DB structure to UI structure
          const mapped: FacilityListItem[] = data.map((f: any) => ({
            id: f.id,
            name: f.name,
            address: `${f.address_line1 || ''}${f.city ? ', ' + f.city : ''}${f.state ? ', ' + f.state : ''} ${f.postal_code || ''}`,
            capacity: f.facility_licensing?.[0]?.bed_capacity || 0,
            type: 'Assisted Living', // Default as not in DB yet
            price: 'Call for Pricing', // Default as not in DB yet
            rating: 0,
            verified: true,
            vacancy: false,
            phone: f.phone,
            image: null,
            city: f.city,
            state: f.state
          }));
          setFacilities(mapped);
          setHasMore((data?.length || 0) === itemsPerPage);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setDataLoading(false);
      }
    };

    fetchFacilities();
  }, [searchQuery, location, currentPage, coordinates, nearestCity]);

  // Client-side filtering is removed, we use server-side now.
  // We need to handle the "Use My Location" button separately to trigger RPC.

  const handleWriteReview = (facilityName: string) => {
    const isLoggedIn = localStorage.getItem('silvertech_user_token');

    if (!isLoggedIn) {
      alert("You must login to view properties");
      return;
    }

    setSelectedFacilityName(facilityName);
    setReviewModalOpen(true);
  };

  const handleClaimBusiness = (facilityId: string) => {
    window.location.href = `/claim/start?id=${facilityId}`;
  };

  // Decorative SVG placeholder generator
  const getFacilityImage = (id: string, name: string): string => {
    // Simple hash for color stability
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = id.charCodeAt(i) + ((hash << 5) - hash);
    }
    const numericId = Math.abs(hash);

    const colors = [
      { bg: '#4A5568', text: '#FFFFFF' },
      { bg: '#2D3748', text: '#FFFFFF' },
      { bg: '#718096', text: '#FFFFFF' },
      { bg: '#4299E1', text: '#FFFFFF' },
      { bg: '#48BB78', text: '#FFFFFF' }
    ];
    const color = colors[numericId % colors.length];
    const displayName = name.substring(0, 40);
    const svg = `<svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
      <rect width="800" height="600" fill="${color.bg}"/>
      <line x1="0" y1="0" x2="800" y2="600" stroke="${color.text}" stroke-width="4" opacity="0.4" />
      <line x1="800" y1="0" x2="0" y2="600" stroke="${color.text}" stroke-width="4" opacity="0.4" />
      <text x="50%" y="45%" font-family="Arial, sans-serif" font-size="24" fill="${color.text}" text-anchor="middle" dominant-baseline="middle">${displayName}</text>
      <rect x="250" y="320" width="300" height="60" rx="30" fill="white" opacity="0.9" />
      <text x="50%" y="358" font-family="Arial, sans-serif" font-size="20" fill="#0f172a" text-anchor="middle" font-weight="bold">Claim This Business</text>
    </svg>`;
    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  };

  const filteredFacilities = facilities; // Pass through as we filtered on server
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + facilities.length;
  const displayedFacilities = facilities;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Search Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-secondary-500 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-white mb-4">Find Senior Living Near You</h1>
          <p className="text-lg text-white/90 mb-8">
            Search thousands of verified facilities with real-time availability
          </p>
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="Search by facility name or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  placeholder="City, State, or ZIP code"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full pl-10 pr-12 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                <button
                  type="button"
                  onClick={getLocation}
                  disabled={geoLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary-600 transition-colors disabled:opacity-50"
                  title="Use my location"
                >
                  {geoLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Crosshair className="w-5 h-5" />
                  )}
                </button>
              </div>
              <button
                className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-medium transition-colors whitespace-nowrap"
                onClick={() => setCurrentPage(1)}
              >
                Search
              </button>
            </div>
            {geoError && (
              <p className="text-sm text-red-600 mt-3">
                {geoError}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="md:w-64 shrink-0">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-slate-900">Filters</h3>
                <Filter size={20} className="text-slate-500" />
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Care Type</label>
                  <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option>All Types</option>
                    <option>Independent Living</option>
                    <option>Assisted Living</option>
                    <option>Memory Care</option>
                    <option>Nursing Home</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price Range</label>
                  <select className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm">
                    <option>Any Price</option>
                    <option>Under $3,000/mo</option>
                    <option>$3,000 - $5,000/mo</option>
                    <option>$5,000 - $7,000/mo</option>
                    <option>Over $7,000/mo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-sm text-slate-700">Only show available</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Search Results</h2>
              <p className="text-slate-600">
                {dataLoading ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin w-4 h-4" /> Loading facilities...</span>
                ) : (
                  `Showing ${filteredFacilities.length > 0 ? startIdx + 1 : 0}-${endIdx} of ${filteredFacilities.length} facilities`
                )}
              </p>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-12 h-12 text-primary-600 animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {displayedFacilities.length === 0 ? (
                  <div className="bg-white border border-slate-200 rounded-lg p-6 text-center text-slate-600">
                    No facilities found. Try adjusting your search or location.
                  </div>
                ) : (
                  displayedFacilities.map((facility) => (
                    <div key={facility.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                      <div className="flex flex-col md:flex-row">
                        <img
                          src={getFacilityImage(facility.id, facility.name)}
                          alt={facility.name}
                          className="w-full md:w-64 h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => handleClaimBusiness(facility.id)}
                          title="Click to claim this business"
                        />
                        <div className="p-6 flex-1 flex flex-col gap-4">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-2">
                              <h3 className="text-xl font-bold text-slate-900">{facility.name}</h3>
                              <p className="text-slate-600 flex items-center gap-2">
                                <MapPin size={16} />
                                <span>{facility.address}</span>
                              </p>
                              {facility.phone && (
                                <p className="text-slate-600 flex items-center gap-2">
                                  <Phone size={16} />
                                  <a href={`tel:${facility.phone}`} className="hover:text-primary-600 transition-colors">
                                    {facility.phone}
                                  </a>
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              {facility.verified && (
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-100">
                                  <CheckCircle size={14} />
                                  Verified
                                </span>
                              )}
                              <AddToCompareButton facility={facility} />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm text-slate-600">
                            <div className="flex items-center gap-2">
                              <DollarSign size={16} className="text-amber-500" />
                              <span>{facility.price}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star size={16} className="text-yellow-400" />
                              <span>{facility.rating ? facility.rating.toFixed(1) : 'New'}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CheckCircle size={16} className="text-primary-600" />
                              <span>{facility.capacity} beds</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Phone size={16} className="text-slate-500" />
                              <span>{facility.city}, {facility.state}</span>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              size="sm"
                              onClick={() => navigate(`/facility/${facility.id}`)}
                            >
                              View Details
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleClaimBusiness(facility.id)}
                            >
                              Claim this business
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleWriteReview(facility.name)}
                            >
                              Write a review
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {!dataLoading && (
              <div className="flex flex-col sm:flex-row items-center justify-between mt-8 gap-4">
                <div className="text-sm text-slate-500">
                  Page {currentPage}
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={!hasMore}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        facilityName={selectedFacilityName}
      />
    </div>
  );
};

export default DirectorySearch;
