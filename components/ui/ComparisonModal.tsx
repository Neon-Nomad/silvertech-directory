import React from 'react';
import { X, Check, Minus, MapPin, Phone, Building2, Shield } from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';
import { Link } from 'react-router-dom';

export const ComparisonModal: React.FC = () => {
  const { selectedFacilities, isOpen, setIsOpen, removeFromCompare } = useComparison();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        
        {/* Backdrop */}
        <div 
          className="fixed inset-0 transition-opacity bg-slate-900 bg-opacity-75" 
          onClick={() => setIsOpen(false)}
        />

        {/* Modal Panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-slate-900">Compare Facilities</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="bg-white rounded-md text-slate-400 hover:text-slate-500 focus:outline-none"
              >
                <X size={24} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full table-fixed min-w-[800px]">
                <thead>
                  <tr>
                    <th className="w-48 p-4"></th>
                    {selectedFacilities.map((facility) => (
                      <th key={facility.id} className="w-64 p-4 text-left align-top relative">
                        <button
                          onClick={() => removeFromCompare(facility.id)}
                          className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                        >
                          <X size={16} />
                        </button>
                        <div className="aspect-video bg-slate-100 rounded-lg mb-3 overflow-hidden">
                          {facility.image ? (
                            <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-400">
                              <Building2 size={32} />
                            </div>
                          )}
                        </div>
                        <Link 
                          to={`/facility/${facility.id}`}
                          className="text-lg font-bold text-slate-900 hover:text-primary-600 block mb-1"
                          onClick={() => setIsOpen(false)}
                        >
                          {facility.name}
                        </Link>
                        <div className="text-sm text-slate-500 flex items-center">
                          <MapPin size={14} className="mr-1" />
                          {facility.city}, {facility.state}
                        </div>
                      </th>
                    ))}
                    {/* Empty slots placeholders */}
                    {[...Array(3 - selectedFacilities.length)].map((_, i) => (
                      <th key={`empty-${i}`} className="w-64 p-4 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                          <PlusCircleIcon />
                          <span className="mt-2 text-sm font-medium">Add Facility</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Price */}
                  <tr>
                    <td className="p-4 font-medium text-slate-900 bg-slate-50">Starting Price</td>
                    {selectedFacilities.map((f) => (
                      <td key={f.id} className="p-4">
                        {f.price && f.price !== 'Call for Pricing' ? (
                          <span className="font-bold text-primary-600">{f.price}<span className="text-xs text-slate-500 font-normal">/mo</span></span>
                        ) : (
                          <span className="text-slate-500 italic">Contact for pricing</span>
                        )}
                      </td>
                    ))}
                    {[...Array(3 - selectedFacilities.length)].map((_, i) => <td key={i}></td>)}
                  </tr>

                  {/* Verified Status */}
                  <tr>
                    <td className="p-4 font-medium text-slate-900 bg-slate-50">Verified License</td>
                    {selectedFacilities.map((f) => (
                      <td key={f.id} className="p-4">
                        {f.verified ? (
                          <span className="inline-flex items-center text-green-700 bg-green-50 px-2 py-1 rounded-full text-xs font-medium">
                            <Shield size={12} className="mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="text-slate-400 text-sm">Unverified</span>
                        )}
                      </td>
                    ))}
                    {[...Array(3 - selectedFacilities.length)].map((_, i) => <td key={i}></td>)}
                  </tr>

                  {/* Capacity */}
                  <tr>
                    <td className="p-4 font-medium text-slate-900 bg-slate-50">Capacity</td>
                    {selectedFacilities.map((f) => (
                      <td key={f.id} className="p-4 text-slate-600">
                        {f.capacity ? `${f.capacity} beds` : 'Unknown'}
                      </td>
                    ))}
                    {[...Array(3 - selectedFacilities.length)].map((_, i) => <td key={i}></td>)}
                  </tr>

                  {/* Contact */}
                  <tr>
                    <td className="p-4 font-medium text-slate-900 bg-slate-50">Contact</td>
                    {selectedFacilities.map((f) => (
                      <td key={f.id} className="p-4">
                         {f.phone ? (
                           <div className="flex items-center text-slate-600">
                             <Phone size={14} className="mr-2" />
                             {f.phone}
                           </div>
                         ) : (
                           <span className="text-slate-400 text-sm">Not available</span>
                         )}
                      </td>
                    ))}
                    {[...Array(3 - selectedFacilities.length)].map((_, i) => <td key={i}></td>)}
                  </tr>

                  {/* Action */}
                  <tr>
                    <td className="p-4 bg-slate-50"></td>
                    {selectedFacilities.map((f) => (
                      <td key={f.id} className="p-4">
                        <Link
                          to={`/facility/${f.id}`}
                          className="block w-full text-center px-4 py-2 border border-primary-600 text-primary-600 rounded-md hover:bg-primary-50 font-medium transition-colors"
                          onClick={() => setIsOpen(false)}
                        >
                          View Details
                        </Link>
                      </td>
                    ))}
                    {[...Array(3 - selectedFacilities.length)].map((_, i) => <td key={i}></td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlusCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <line x1="12" y1="8" x2="12" y2="16"></line>
    <line x1="8" y1="12" x2="16" y2="12"></line>
  </svg>
);
