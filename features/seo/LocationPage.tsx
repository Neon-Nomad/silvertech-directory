import React from 'react';
import { Navigate, useParams } from 'react-router-dom';

export const LocationPage: React.FC = () => {
  const { state, city } = useParams<{ state: string; city: string }>();
  
  if (state && city) {
    return <Navigate to={`/senior-living/${state}/${city}/assisted-living/`} replace />;
  }
  
  return <Navigate to="/" replace />;
};
