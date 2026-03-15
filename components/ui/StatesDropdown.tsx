import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ALL_STATES } from '@/src/data/states';

interface StatesDropdownProps {
  className?: string;
  onStateSelect?: () => void;
}

export const StatesDropdown: React.FC<StatesDropdownProps> = ({ className = '', onStateSelect }) => {
  const navigate = useNavigate();

  const handleStateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const slug = e.target.value;
    if (slug) {
      navigate(`/assisted-living/${slug}/`);
      onStateSelect?.();
    }
  };

  return (
    <select
      onChange={handleStateChange}
      defaultValue=""
      className={`bg-slate-800 text-slate-300 border border-slate-700 rounded-md py-1 px-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${className}`}
    >
      <option value="" disabled>Browse by State</option>
      {ALL_STATES.map((state) => (
        <option key={state.abbreviation} value={state.slug}>
          {state.name}
        </option>
      ))}
    </select>
  );
};
