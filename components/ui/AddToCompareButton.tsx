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
  const isFull = selectedFacilities.length >= 3;
  const isDisabled = isFull && !isSelected;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isDisabled) return;

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
        disabled={isDisabled}
        className={`p-2 rounded-full transition-colors ${isSelected
          ? 'bg-primary-100 text-primary-600 hover:bg-primary-200'
          : isDisabled
            ? 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-100'
            : 'bg-white text-slate-400 hover:text-primary-600 hover:bg-slate-50 border border-slate-200'
          } ${className}`}
        title={isSelected ? "Remove from comparison" : isDisabled ? "Comparison list full (3/3)" : "Add to comparison"}
      >
        {isSelected ? <Check size={18} /> : <Plus size={18} />}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`inline-flex items-center text-sm font-medium transition-colors ${isSelected
        ? 'text-primary-600 hover:text-primary-700'
        : isDisabled
          ? 'text-slate-300 cursor-not-allowed'
          : 'text-slate-500 hover:text-primary-600'
        } ${className}`}
      title={isDisabled ? "Comparison list full (3/3)" : ""}
    >
      {isSelected ? (
        <>
          <Check size={16} className="mr-1.5" />
          Added
        </>
      ) : isDisabled ? (
        <>
          <Plus size={16} className="mr-1.5" />
          Full (3/3)
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
