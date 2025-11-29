import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface ComparisonFacility {
  id: string;
  name: string;
  image?: string | null;
  city: string;
  state: string;
  price?: string | null;
  capacity?: number;
  verified?: boolean;
  phone?: string | null;
  type?: string;
  address?: string;
}

interface ComparisonContextType {
  selectedFacilities: ComparisonFacility[];
  addToCompare: (facility: ComparisonFacility) => void;
  removeFromCompare: (facilityId: string) => void;
  clearComparison: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

export const ComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedFacilities, setSelectedFacilities] = useState<ComparisonFacility[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('comparison_facilities');
    if (saved) {
      try {
        setSelectedFacilities(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse comparison facilities', e);
      }
    }
  }, []);

  // Save to localStorage whenever changed
  useEffect(() => {
    localStorage.setItem('comparison_facilities', JSON.stringify(selectedFacilities));
  }, [selectedFacilities]);

  const addToCompare = (facility: ComparisonFacility) => {
    if (selectedFacilities.find(f => f.id === facility.id)) return;

    if (selectedFacilities.length >= 3) {
      return;
    }

    setSelectedFacilities(prev => [...prev, facility]);
  };

  const removeFromCompare = (facilityId: string) => {
    setSelectedFacilities(prev => prev.filter(f => f.id !== facilityId));
  };

  const clearComparison = () => {
    setSelectedFacilities([]);
    setIsOpen(false);
  };

  return (
    <ComparisonContext.Provider value={{
      selectedFacilities,
      addToCompare,
      removeFromCompare,
      clearComparison,
      isOpen,
      setIsOpen
    }}>
      {children}
    </ComparisonContext.Provider>
  );
};

export const useComparison = () => {
  const context = useContext(ComparisonContext);
  if (context === undefined) {
    throw new Error('useComparison must be used within a ComparisonProvider');
  }
  return context;
};
