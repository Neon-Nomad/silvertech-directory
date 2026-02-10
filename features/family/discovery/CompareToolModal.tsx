import React, { useEffect, useMemo, useState } from 'react';
import { X, MapPin, Phone, CheckCircle, ArrowRight, Info } from 'lucide-react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/Button';

interface CompareToolModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseFacility: any;
}

const getCareTypes = (facility: any) =>
  (facility?.facility_care_types || [])
    .map((item: any) => item?.care_types?.name)
    .filter(Boolean);

const priceOverlap = (aMin?: number | null, aMax?: number | null, bMin?: number | null, bMax?: number | null) => {
  if (!aMin || !aMax || !bMin || !bMax) return false;
  return aMin <= bMax && bMin <= aMax;
};

const scoreFacility = (baseFacility: any, facility: any) => {
  const baseCareTypes = getCareTypes(baseFacility);
  const careTypes = getCareTypes(facility);
  const hasCareOverlap = careTypes.some((type: string) => baseCareTypes.includes(type));
  const hasPriceOverlap = priceOverlap(
    baseFacility.min_price,
    baseFacility.max_price,
    facility.min_price,
    facility.max_price
  );
  const sameCity = facility.city === baseFacility.city;
  const score = (hasCareOverlap ? 2 : 0) + (hasPriceOverlap ? 1 : 0) + (sameCity ? 1 : 0);
  return { hasCareOverlap, hasPriceOverlap, sameCity, score };
};

const getMatchPercent = (score: number) => {
  const percent = Math.round((score / 4) * 100);
  return Math.max(35, percent);
};

export const CompareToolModal: React.FC<CompareToolModalProps> = ({ isOpen, onClose, baseFacility }) => {
  const [comparables, setComparables] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const baseCareTypes = useMemo(() => getCareTypes(baseFacility), [baseFacility]);

  useEffect(() => {
    if (!isOpen || !baseFacility) return;

    const fetchComparables = async () => {
      setLoading(true);
      setError(null);

      try {
        const city = baseFacility.city;
        const state = baseFacility.state;

        const fetchFacilities = async (filters: { city?: string; state?: string }) => {
          const query = supabase
            .from('facilities')
            .select(`
              id,
              name,
              image,
              city,
              state,
              address_line1,
              postal_code,
              phone,
              min_price,
              max_price,
              facility_care_types(care_types(name))
            `)
            .neq('id', baseFacility.id);

          if (filters.state) query.eq('state', filters.state);
          if (filters.city) query.eq('city', filters.city);

          const { data, error } = await query.limit(60);
          if (error) throw error;
          return data || [];
        };

        const cityResults = await fetchFacilities({ city, state });
        const scoredCity = cityResults.map((facility: any) => {
          const scoring = scoreFacility(baseFacility, facility);
          return { ...facility, _score: scoring.score };
        });

        let combined = scoredCity;

        if (combined.length < 5) {
          const stateResults = await fetchFacilities({ state });
          const filteredState = stateResults.filter(
            (facility: any) => !combined.some((existing: any) => existing.id === facility.id)
          );

          const scoredState = filteredState.map((facility: any) => {
            const scoring = scoreFacility(baseFacility, facility);
            return { ...facility, _score: scoring.score };
          });

          combined = [...combined, ...scoredState];
        }

        combined.sort((a, b) => b._score - a._score || a.name.localeCompare(b.name));
        const topFive = combined.slice(0, 5);
        setComparables(topFive);
        setSelected(topFive[0] || null);
      } catch (err) {
        console.error('Error fetching comparable facilities:', err);
        setError('We could not load similar homes right now.');
      } finally {
        setLoading(false);
      }
    };

    fetchComparables();
  }, [isOpen, baseFacility, baseCareTypes]);

  if (!isOpen) return null;

  const selectedScore = selected ? scoreFacility(baseFacility, selected) : null;
  const selectedPercent = selectedScore ? getMatchPercent(selectedScore.score) : 0;

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-slate-900/70" onClick={onClose} />

      <div className="relative max-w-6xl mx-auto mt-12 mb-10 bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f8f4ef]">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Research Tool • SilverTech</p>
            <h2 className="text-2xl font-serif font-semibold text-slate-900">Compare Similar Homes</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/80 text-slate-500">
            <X size={20} />
          </button>
        </div>

        <div className="grid lg:grid-cols-12 gap-6 px-6 py-6">
          <section className="lg:col-span-8 space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <span className="text-[10px] uppercase tracking-[0.3em] text-primary-600 font-semibold">Your Selection</span>
                <div className="mt-3 rounded-xl overflow-hidden bg-slate-100 h-44">
                  {baseFacility.image ? (
                    <img src={baseFacility.image} alt={baseFacility.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                      {baseFacility.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-serif font-semibold text-slate-900">{baseFacility.name}</h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {baseFacility.city}, {baseFacility.state}
                  </p>
                  <p className="text-sm text-slate-700 mt-2"><strong>Monthly starting:</strong> {baseFacility.min_price ? `$${baseFacility.min_price.toLocaleString()}` : 'Call'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(baseCareTypes.length ? baseCareTypes : ['Assisted Living']).slice(0, 2).map((type) => (
                      <span key={type} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase tracking-[0.3em] text-slate-400 font-semibold">Best Match</span>
                  {selected && (
                    <span className="text-[10px] uppercase tracking-[0.3em] text-primary-700 font-semibold bg-primary-50 px-2 py-1 rounded-full">
                      {selectedPercent}% Match
                    </span>
                  )}
                </div>
                <div className="mt-3 rounded-xl overflow-hidden bg-slate-100 h-44">
                  {selected?.image ? (
                    <img src={selected.image} alt={selected.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-slate-400">
                      {selected?.name?.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-serif font-semibold text-slate-900">{selected?.name || 'Select a home'}</h3>
                  <p className="text-sm text-slate-600 flex items-center gap-1 mt-1">
                    <MapPin size={14} /> {selected?.city}, {selected?.state}
                  </p>
                  <p className="text-sm text-slate-700 mt-2"><strong>Monthly starting:</strong> {selected?.min_price ? `$${selected.min_price.toLocaleString()}` : 'Call'}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(selected ? getCareTypes(selected) : []).slice(0, 2).map((type) => (
                      <span key={type} className="px-3 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
                        {type}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-700">Similarity Score</h4>
                <div className="text-3xl font-semibold text-primary-700">{selectedPercent}%</div>
              </div>
              <div className="mt-3 h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                <div className="h-full bg-primary-500" style={{ width: `${selectedPercent}%` }} />
              </div>
              <p className="mt-3 text-xs text-slate-500 flex items-center gap-2">
                <Info size={14} /> Matches are based on care levels, city proximity, and price overlap.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <h4 className="text-sm font-semibold text-slate-900 mb-3">Side-by-side snapshot</h4>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs uppercase text-slate-400 mb-2">{baseFacility.name}</p>
                  <p className="text-slate-700"><strong>Price:</strong> {baseFacility.min_price ? `$${baseFacility.min_price.toLocaleString()}` : 'Call'}{baseFacility.max_price ? ` - $${baseFacility.max_price.toLocaleString()}` : ''}</p>
                  <p className="text-slate-700"><strong>Care:</strong> {baseCareTypes.join(', ') || 'Assisted Living'}</p>
                  <p className="text-slate-700"><strong>Phone:</strong> {baseFacility.phone || 'Not listed'}</p>
                </div>
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-xs uppercase text-slate-400 mb-2">{selected?.name || 'Select a home'}</p>
                  <p className="text-slate-700"><strong>Price:</strong> {selected?.min_price ? `$${selected.min_price.toLocaleString()}` : 'Call'}{selected?.max_price ? ` - $${selected.max_price.toLocaleString()}` : ''}</p>
                  <p className="text-slate-700"><strong>Care:</strong> {selected ? getCareTypes(selected).join(', ') || 'Assisted Living' : '—'}</p>
                  <p className="text-slate-700"><strong>Phone:</strong> {selected?.phone || 'Not listed'}</p>
                </div>
              </div>
              <div className="flex justify-end mt-4">
                {selected && (
                  <Button
                    variant="outline"
                    className="border-slate-300 hover:bg-slate-100"
                    onClick={() => window.open(`/facility/${selected.id}`, '_blank')}
                  >
                    View Full Profile
                  </Button>
                )}
              </div>
            </div>
          </section>

          <section className="lg:col-span-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">Top comparable homes</h3>
                <span className="text-xs text-slate-400">Top 5</span>
              </div>

              {loading && (
                <div className="py-10 text-center text-slate-500">Finding similar homes...</div>
              )}

              {error && (
                <div className="py-6 text-center text-red-600">{error}</div>
              )}

              {!loading && !error && (
                <div className="space-y-3 max-h-[430px] overflow-y-auto pr-2">
                  {comparables.map((facility) => {
                    const percent = getMatchPercent(facility._score || 0);
                    return (
                      <button
                        key={facility.id}
                        onClick={() => setSelected(facility)}
                        className={`w-full text-left p-3 rounded-xl border transition ${selected?.id === facility.id
                          ? 'border-primary-500 bg-primary-50/40'
                          : 'border-slate-200 hover:border-slate-400'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100">
                            {facility.image ? (
                              <img src={facility.image} alt={facility.name} className="w-full h-full object-cover" loading="lazy" decoding="async" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400 font-semibold">
                                {facility.name?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-slate-900">{facility.name}</p>
                            <p className="text-sm text-slate-600">{facility.city}, {facility.state}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-xs font-semibold text-primary-700">{percent}%</div>
                            <ArrowRight className="w-4 h-4 text-slate-400 mt-1" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="mt-4 bg-[#f8f4ef] border border-slate-200 rounded-xl p-3 text-xs text-slate-600">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-primary-600 mt-0.5" />
                  <span>Matches prioritize care type overlap, price range, and city proximity.</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
