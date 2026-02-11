import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Search, Scale } from 'lucide-react';
import { ALL_STATES } from '@/src/data/states';

export const RegulatoryLibrary: React.FC = () => {
  const [filter, setFilter] = useState('');

  const filteredStates = useMemo(() => {
    if (!filter.trim()) return ALL_STATES;
    const q = filter.toLowerCase();
    return ALL_STATES.filter(
      (s) => s.name.toLowerCase().includes(q) || s.abbreviation.toLowerCase().includes(q)
    );
  }, [filter]);

  // Group filtered states by first letter
  const groupedStates = useMemo(() => {
    return filteredStates.reduce((acc, state) => {
      const letter = state.name[0].toUpperCase();
      if (!acc[letter]) acc[letter] = [];
      acc[letter].push(state);
      return acc;
    }, {} as Record<string, typeof ALL_STATES>);
  }, [filteredStates]);

  const letters = Object.keys(groupedStates).sort();

  return (
    <>
      <Helmet>
        <title>Regulatory Library | SilverTech Directory</title>
        <meta
          name="description"
          content="The complete national database of senior living regulations, Medicaid programs, and licensing authorities for all 50 states."
        />
        <link rel="canonical" href="https://silvertechdirectory.com/regulatory-library" />
      </Helmet>

      <div className="bg-warm-white min-h-screen">
        {/* ── Hero ── */}
        <section className="bg-warm-gray border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-16 md:py-20">
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-gold mb-4 block">
              50 State Directory
            </span>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-charcoal mb-6">
              Regulatory Library
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl leading-relaxed">
              The authoritative index for all US senior living regulations, Medicaid programs,
              and licensing authorities. Select a state to view its consolidated regulatory hub.
            </p>
          </div>
        </section>

        {/* ── Search Filter ── */}
        <section className="border-b border-slate-200">
          <div className="max-w-[1200px] mx-auto px-6 py-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search states..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-sm text-charcoal placeholder-slate-400 focus:outline-none focus:border-gold transition-colors"
              />
            </div>
          </div>
        </section>

        {/* ── State Grid ── */}
        <section className="max-w-[1200px] mx-auto px-6 py-12">
          {letters.length === 0 ? (
            <p className="text-slate-500 text-center py-12">No states match your search.</p>
          ) : (
            <div className="space-y-12">
              {letters.map((letter) => (
                <div key={letter}>
                  <h2 className="text-2xl font-serif font-bold text-slate-300 mb-6 border-b border-slate-100 pb-2">
                    {letter}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupedStates[letter].map((state) => (
                      <Link
                        key={state.slug}
                        to={`/states/${state.slug}/regulatory`}
                        className="bg-white border border-slate-200 rounded-xl p-5 hover:border-gold hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 bg-warm-gray rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-gold/10 transition-colors">
                            <Scale className="w-5 h-5 text-slate-400 group-hover:text-gold transition-colors" />
                          </div>
                          <div>
                            <h3 className="font-bold text-charcoal group-hover:text-gold transition-colors">
                              {state.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-1">
                              Regulations, Medicaid, Licensing
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
};
