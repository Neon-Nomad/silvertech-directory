import React from 'react';
import { Plus, Check } from 'lucide-react';
import { useComparison, ComparisonFacility } from '@/src/context/ComparisonContext';

interface AddToCompareButtonProps {
  facility: ComparisonFacility;
  variant?: 'icon' | 'text';
  className?: string;
}

export const AddToCompareButton: React.FC<AddToCompareButtonProps> = ({ 
  facility, 
  variant = 'text',
  className = ''
}) => {
  const { selectedFacilities, addToCompare, removeFromCompare } = useComparison();
  
  const isSelected = selectedFacilities.some(f => f.id === facility.id);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a Link
    e.stopPropagation();
    
    if (isSelected) {
      removeFromCompare(facility.id);
    } else {
      addToCompare(facility);
    }
  };

  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        className={`p-2 rounded-full transition-colors ${
          isSelected 
            ? 'bg-primary-100 text-primary-600 hover:bg-primary-200' 
            : 'bg-white text-slate-400 hover:text-primary-600 hover:bg-slate-50 border border-slate-200'
        } ${className}`}
        title={isSelected ? "Remove from comparison" : "Add to comparison"}
      >
        {isSelected ? <Check size={18} /> : <Plus size={18} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center text-sm font-medium transition-colors ${
        isSelected
          ? 'text-primary-600 hover:text-primary-700'
          : 'text-slate-500 hover:text-primary-600'
      } ${className}`}
    >
      {isSelected ? (
        <>
          <Check size={16} className="mr-1.5" />
          Added
        </>
      ) : (
        <>
          <Plus size={16} className="mr-1.5" />
          Compare
        </>
      )}
    </button>
  );
};
