import React from 'react';
import { Link } from 'react-router-dom';
import { Award, Building2, ChevronRight, MapPin, Shield, Star } from 'lucide-react';
import { RankedFacility } from '@/src/utils/ranking';
import { buildFacilityDetailPath } from '@/src/utils/facilityPath';

interface BestFacilitiesListProps {
  facilities: RankedFacility[];
  cityName: string;
}

export const BestFacilitiesList: React.FC<BestFacilitiesListProps> = ({ facilities, cityName }) => {
  // Take only top 10
  const topFacilities = facilities.slice(0, 10);

  if (topFacilities.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-8 h-8 text-yellow-500" />
        <h2 className="text-2xl font-bold text-slate-900">
          Top {topFacilities.length} Best Assisted Living Facilities in {cityName}
        </h2>
      </div>

      <div className="space-y-6">
        {topFacilities.map((facility, index) => (
          <div 
            key={facility.id} 
            className="relative bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all overflow-hidden"
          >
            {/* Rank Badge */}
            <div className="absolute top-0 left-0 bg-yellow-400 text-yellow-900 font-bold px-4 py-2 rounded-br-xl z-10">
              #{index + 1}
            </div>

            <div className="flex flex-col md:flex-row gap-6 pt-8 md:pt-0 md:pl-16">
              {/* Image Placeholder or Real Image */}
              <div className="w-full md:w-48 h-32 bg-slate-100 rounded-lg flex-shrink-0 flex items-center justify-center">
                {facility.image ? (
                  <img src={facility.image} alt={facility.name} className="w-full h-full object-cover rounded-lg" loading="lazy" decoding="async" />
                ) : (
                  <Building2 className="w-12 h-12 text-slate-300" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">
                      <Link
                        to={buildFacilityDetailPath({
                          id: facility.id,
                          publicSlug: (facility as any).public_slug,
                          publicRouteId: (facility as any).public_route_id,
                          careType: (facility as any).primary_care_type_slug || 'assisted-living',
                          state: facility.state,
                          city: facility.city,
                        })}
                        className="hover:text-primary-600"
                      >
                        {facility.name}
                      </Link>
                    </h3>
                    <div className="flex items-center text-slate-600 mb-2">
                      <MapPin size={16} className="mr-2 text-slate-400" />
                      {facility.address_line1}, {facility.city}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <Star size={16} className="mr-1 text-yellow-400 fill-yellow-400" />
                        Top Rated
                      </span>
                      {facility.verified && (
                        <span className="flex items-center text-green-700 font-medium">
                          <Shield size={16} className="mr-1" />
                          Verified
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-right hidden md:block">
                     <Link 
                        to={buildFacilityDetailPath({
                          id: facility.id,
                          publicSlug: (facility as any).public_slug,
                          publicRouteId: (facility as any).public_route_id,
                          careType: (facility as any).primary_care_type_slug || 'assisted-living',
                          state: facility.state,
                          city: facility.city,
                        })}
                        className="inline-flex items-center justify-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors"
                      >
                        View Details <ChevronRight size={16} className="ml-1" />
                      </Link>
                  </div>
                </div>

                {/* Mobile CTA */}
                <div className="mt-4 md:hidden">
                    <Link 
                        to={buildFacilityDetailPath({
                          id: facility.id,
                          publicSlug: (facility as any).public_slug,
                          publicRouteId: (facility as any).public_route_id,
                          careType: (facility as any).primary_care_type_slug || 'assisted-living',
                          state: facility.state,
                          city: facility.city,
                        })}
                        className="w-full inline-flex items-center justify-center px-4 py-2 border border-primary-600 text-sm font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors"
                      >
                        View Details <ChevronRight size={16} className="ml-1" />
                      </Link>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
