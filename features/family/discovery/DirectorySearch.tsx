import React, { useState } from 'react';
import { Search, MapPin, DollarSign,  Star, Filter } from 'lucide-react';

import facilitiesData from '../../../src/data/facilities.json';
import ReviewsModal from '../../../components/ReviewsModal';
import { generateReviews, calculateAverageRating } from '../../../src/utils/reviewGenerator';


// Deterministic Unsplash image strategy - consistent images for each facility
const PLACEHOLDER_IMAGES = [
  "1560185893-a55cbc8c57e8", // Modern senior facility exterior
  "1576675784201-0205e5a87df3", // Healthcare facility hallway
  "1519494080410-f9aa76039b0d", // Bright residential building
  "1580587771525-78b9dba3b91d", // Senior community building
  "1582721863-d7c08e9bb0ec", // Modern apartment building
  "1545324418-4fb5e76c05df", // Residential care exterior
  "1512917774080-9991f1c4c750", // Contemporary building facade
  "1486406146456-c4f43b3b6888"  // Beautiful residential architecture
];

// Helper function to get consistent image for each facility based on ID
const getFacilityImage = (id: string): string => {
  // Extract numeric part from facility ID
  const numericId = parseInt(id.replace(/\D/g, '')) || 0;
  // Use modulo to select image index
  const imageIndex = numericId % PLACEHOLDER_IMAGES.length;
  const imageId = PLACEHOLDER_IMAGES[imageIndex];
  return `https://images.unsplash.com/photo-${imageId}?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80`;
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
