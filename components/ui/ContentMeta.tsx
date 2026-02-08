import React from 'react';

interface ContentMetaProps {
  author?: string;
  updated?: string;
  note?: string;
}

export const ContentMeta: React.FC<ContentMetaProps> = ({
  author = 'SilverTech Editorial Team',
  updated = 'February 8, 2026',
  note
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-slate-500 border border-slate-200 rounded-lg px-4 py-3 bg-white">
      <div>
        <span className="font-medium text-slate-700">Author:</span> {author}
      </div>
      <div>
        <span className="font-medium text-slate-700">Last updated:</span> {updated}
      </div>
      {note ? (
        <div className="sm:ml-auto text-slate-500">
          {note}
        </div>
      ) : null}
    </div>
  );
};
