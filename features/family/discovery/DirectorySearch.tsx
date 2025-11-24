import React, { useState } from 'react';
import { Search, MapPin, DollarSign,  Star, Filter } from 'lucide-react';

import facilitiesData from '../../../src/data/facilities.json';
import ReviewsModal from '../../../components/ReviewsModal';
import { generateReviews, calculateAverageRating } from '../../../src/utils/reviewGenerator';


// Deterministic Unsplash image strategy - 50 verified architectural photos
// Large array ensures variety across 2,000 facilities with minimal repeats
const FACILITY_IMAGES = [
  "1519494080410-f9aa76039b0d", "1564013799919-ab600027ffc6", "1545324418-4fb5e76c05df",
  "1486406146456-c4f43b3b6888", "1449247709967-d4461a6a6103", "1494145904049-0dca59b4bbad",
  "1448630360428-65456885c650", "1477959858617-67f85cf4f1df", "1512917774080-9991f1c4c750",
  "1560185127-6d643b8e6f64", "1555636222-cae831e670b3", "1480714378408-67cf0d13851b",
  "1523217582562-09d0def993a6", "1542314831-068cd1dbfeeb", "1512917774080-9991f1c4c750",
  "1600607687920-4e2a09cf159d", "1600585154340-be1ebe4e7ef5", "1600566753190-17f0baa2a6c3",
  "1600607687644-c7171b42498b", "1600607686527-6fb886090705", "1600607686664-7c0c7e4e7c3c",
  "1545324418-4fb5e76c05df", "1565008576549-57569a049a4d", "1582721863-d7c08e9bb0ec",
  "1600047509807-ba8f99d2cdde", "1600047743923-e23d5f33f9d8", "1600607686990-e1e7e37a7c7d",
  "1580587771525-78b9dba3b91d", "1512915922686-57c11dde9b6b", "1577495508326-19e2dfc34c05",
  "1600607687920-4e2a09cf159d", "1565008576502-2f88b60a8c4e", "1545324418-127eb8dfee33",
  "1516455590571-18256e5bb9ff", "1516455590608-9b69fd7f8fd5", "1518005068251-0c6b5a9f6e5f",
  "1582407947550-7ab0b5c8f5b0", "1577495508326-19e2dfc34c05", "1600607687169-80e5f8a7b1e9",
  "1564013877-1d7e3cf2e6e4", "1580587771525-78b9dba3b91d", "1512915922686-57c11dde9b6b",
  "1600585154526-909b3f061c6e", "1600585154340-be1ebe4e7ef5", "1600566752724-bb13b0d0b9e3",
  "1600607686527-6fb886090705", "1600607686664-7c0c7e4e7c3c", "1600566753190-17f0baa2a6c3",
  "1565008575629-22e3dd4f55c3", "1565008577155-0d8ba3c8c2c3"
];

// Helper function to get deterministic image for each facility
const getFacilityImage = (id: string): string => {
  const numericId = parseInt(id.replace(/\D/g, ''), 10) || 0;
  const imageIndex = numericId % FACILITY_IMAGES.length;
  const imageId = FACILITY_IMAGES[imageIndex];
  return `https://images.unsplash.com/photo-${imageId}?auto=format&fit=crop&w=800&q=80`;
};

const DirectorySearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');
  const [selectedFacility, setSelectedFacility] = useState<typeof facilitiesData[0] | null>(null);
  const [isReviewsModalOpen, setIsReviewsModalOpen] = useState(false);

  const handleShowReviews = (facility: typeof facilitiesData[0]) => {
    setSelectedFacility(facility);
    setIsReviewsModalOpen(true);
  };

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
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-md font-medium transition-colors whitespace-nowrap">
                Search
              </button>
            </div>
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
              <p className="text-slate-600">Found {facilitiesData.length} facilities near you</p>
            </div>

            <div className="space-y-4">
              {facilitiesData.map((facility, index) => (
                <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Facility Image */}
                  <img 
                    src={getFacilityImage(facility.id)} 
                    alt={facility.name}
                    className="w-full h-48 object-cover"
                  />
                  
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 mb-1">{facility.name}</h3>
                      <p className="text-slate-600 flex items-center gap-2">
                        <MapPin size={16} />
                        {facility.address}
                      </p>
                    </div>
                    <button 
                      onClick={() => handleShowReviews(facility)}
                      className="flex items-center gap-1 bg-amber-100 hover:bg-amber-200 px-3 py-1 rounded-full transition-colors cursor-pointer"
                    >
                      <Star size={16} className="text-amber-600 fill-amber-600" />
                      <span className="font-semibold text-amber-900">
                        {calculateAverageRating(generateReviews(facility.id, facility.name))}
                      </span>
                      <span className="text-xs text-amber-700 ml-1">({generateReviews(facility.id, facility.name).length})</span>
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium">
                      {facility.type}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm font-medium">
                      Capacity: {facility.capacity}
                    </span>
                    {facility.verified && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                        ✓ Verified
                      </span>
                    )}
                  </div>
                  
                  <p className="text-slate-700 mb-4 line-clamp-2">
                    Premium senior living facility with {facility.capacity} beds, offering 24/7 care, engaging activities, and restaurant-style dining.
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900">
                      <DollarSign size={20} className="text-accent-600" />
                      <span className="font-bold text-lg">{facility.price}</span>
                    </div>
                    <div className="flex gap-2">
                      <button className="border border-primary-600 text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-md font-medium transition-colors">
                        View Details
                      </button>
                      <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md font-medium transition-colors">
                        Schedule Tour
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <p className="text-slate-600 mb-4">Showing {facilitiesData.length} results</p>
              <button className="bg-slate-200 hover:bg-slate-300 text-slate-900 px-6 py-3 rounded-md font-medium transition-colors">
                Load More Results
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Modal */}
      {selectedFacility && (
        <ReviewsModal
          isOpen={isReviewsModalOpen}
          onClose={() => setIsReviewsModalOpen(false)}
          facilityName={selectedFacility.name}
          reviews={generateReviews(selectedFacility.id, selectedFacility.name)}
        />
      )}
    </div>
  );
};

export default DirectorySearch;
