import React from 'react';
import { Link } from 'react-router-dom';

interface DataSourceNoteProps {
  note?: string;
  showEditorialLink?: boolean;
}

export const DataSourceNote: React.FC<DataSourceNoteProps> = ({
  note = 'Data is compiled from public records and official state licensing authorities.',
  showEditorialLink = true
}) => {
  return (
    <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg px-4 py-3">
      <span className="font-medium text-slate-600">Data source:</span> {note}
      {showEditorialLink ? (
        <>
          {' '}Learn more in our{' '}
          <Link to="/editorial-policy" className="text-primary-600 hover:underline">
            Editorial Policy
          </Link>
          .
        </>
      ) : null}
    </div>
  );
};
