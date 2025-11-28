import React from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useComparison } from '@/src/context/ComparisonContext';

export const ComparisonBar: React.FC = () => {
  const { selectedFacilities, removeFromCompare, clearComparison, setIsOpen } = useComparison();

  if (selectedFacilities.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-lg z-50 animate-slide-up">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:block">
              <span className="font-bold text-slate-900">{selectedFacilities.length}</span>
              <span className="text-slate-500 ml-1">selected to compare</span>
            </div>

            <div className="flex items-center gap-3">
              {selectedFacilities.map((facility) => (
                <div key={facility.id} className="relative group">
                  <div className="w-12 h-12 rounded-md overflow-hidden border border-slate-200 bg-slate-100">
                    {facility.image ? (
                      <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-400 font-bold">
                        {facility.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeFromCompare(facility.id)}
                    className="absolute -top-2 -right-2 bg-white rounded-full p-0.5 shadow-sm border border-slate-200 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={clearComparison}
              className="text-sm text-slate-500 hover:text-slate-700 font-medium hidden sm:block"
            >
              Clear All
            </button>
            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Compare Now <ArrowRight size={16} className="ml-2" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
