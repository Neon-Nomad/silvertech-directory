import React, { useState } from 'react';
import { Search, MapPin, DollarSign, Star, Filter, Phone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import facilitiesData from '../../../src/data/facilities.json';
import { ReviewModal } from '../reviews/ReviewModal';

import { useSearchParams } from 'react-router-dom';

const DirectorySearch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedFacilityName, setSelectedFacilityName] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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
    // Navigate to claim page or show modal
    // For now, we'll use the existing claim route structure or a new one
    // Since we have /claim/:code, we might need a general claim start page
    // Let's just alert for now or redirect to a generic claim page
    window.location.href = `/claim/start?id=${facilityId}`;
  };

  // Decorative SVG placeholder generator
  const getFacilityImage = (id: string, name: string): string => {
    const numericId = parseInt(id.replace(/\D/g, ''), 10) || 0;
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

  const totalPages = Math.ceil(facilitiesData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, facilitiesData.length);
  const displayedFacilities = facilitiesData.slice(startIdx, endIdx);

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
              <p className="text-slate-600">
                Showing {startIdx + 1}-{endIdx} of {facilitiesData.length} facilities
              </p>
            </div>
            <div className="space-y-4">
              {displayedFacilities.map((facility, index) => (
                <div key={index} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow overflow-hidden">
                  <div className="flex flex-col md:flex-row">
                    <img
                      src={getFacilityImage(facility.id, facility.name)}
                      alt={facility.name}
                      className="w-full md:w-64 h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => handleClaimBusiness(facility.id)}
                      title="Click to claim this business"
                    />
                    <div className="p-6 flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 mb-1">{facility.name}</h3>
                          <p className="text-slate-600 flex items-center gap-2">
                            <MapPin size={16} />
                            {facility.address}
                          </p>
                          {/* @ts-ignore */}
                          {facility.phone && (
                            <p className="text-slate-600 flex items-center gap-2 mt-1">
                              <Phone size={16} />
                              <a href={`tel:${facility.phone}`} className="hover:text-primary-600 transition-colors">
                                {facility.phone}
                              </a>
                            </p>
                          )}
                        </div>
                        <div className="flex items-center bg-green-50 px-2 py-1 rounded-lg">
                          <Star className="w-4 h-4 text-green-600 fill-current mr-1" />
                          <span className="font-bold text-green-800">4.8</span>
                        </div>
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
                      
                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2 text-slate-900">
                          <DollarSign size={20} className="text-accent-600" />
                          <span className="font-bold text-lg">{facility.price}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="primary"
                            onClick={() => window.location.href = `/facility/${facility.id}`}
                          >
                            View Details
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => handleWriteReview(facility.name)}
                          >
                            Write Review
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Pagination Controls */}
            <div className="flex justify-center items-center mt-8 space-x-4">
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-slate-600">Page {currentPage} of {totalPages}</span>
              <Button
                variant="outline"
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
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
