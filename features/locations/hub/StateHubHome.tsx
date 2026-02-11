import React from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ALL_STATES } from '../../../src/data/states';

export const StateHubHome: React.FC = () => {
  const { state } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find(s => s.slug === state);

  if (!stateDef) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to={`/states/${stateDef.slug}/assisted-living`} replace />;
};
