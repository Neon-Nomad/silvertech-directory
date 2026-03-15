import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { buildCareTypePath } from '@/src/utils/facilityPath';

export const LocationPage: React.FC = () => {
  const { state, city } = useParams<{ state: string; city: string }>();
  
  if (state && city) {
    return <Navigate to={buildCareTypePath({ careType: 'assisted-living', state, city })} replace />;
  }
  
  return <Navigate to="/" replace />;
};
