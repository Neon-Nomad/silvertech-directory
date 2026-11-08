import React from 'react';
import { Link } from 'react-router-dom';
import { useComparison } from '@/src/context/ComparisonContext';

// Shows the facilities selected for comparison, and links to the comparison page. Renders nothing when empty.
const ComparisonTray: React.FC = () => {
  const { selectedFacilities, clearComparison } = useComparison();
  if (selectedFacilities.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Facilities selected for comparison"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-300 bg-white shadow-lg"
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-3 text-sm">
        <span className="font-semibold">
          Comparing {selectedFacilities.length} of 3:
        </span>
        <span className="min-w-0 flex-1 truncate text-charcoal/70">
          {selectedFacilities.map((facility) => facility.name).join(', ')}
        </span>
        <button type="button" className="font-bold underline" onClick={clearComparison}>
          Clear
        </button>
        <Link
          className="inline-flex min-h-11 items-center rounded-md bg-charcoal px-4 py-2 font-bold text-white"
          to="/compare"
        >
          Compare
        </Link>
      </div>
    </div>
  );
};

export default ComparisonTray;
