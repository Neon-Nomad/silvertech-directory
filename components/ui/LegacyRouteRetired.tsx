import React from 'react';
import { Link } from 'react-router-dom';

export const LegacyRouteRetired: React.FC = () => (
  <div className="min-h-[70vh] bg-warm-gray flex items-center justify-center px-4">
    <div className="max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">410 Gone</p>
      <h1 className="mt-4 text-3xl font-bold text-slate-900">This URL has been retired</h1>
      <p className="mt-4 text-slate-600">
        SilverTech now serves directory pages on clean care-type routes and community pages under `/community`.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/assisted-living/" className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Browse assisted living
        </Link>
        <Link to="/regulations/" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
          Browse regulations
        </Link>
      </div>
    </div>
  </div>
);
