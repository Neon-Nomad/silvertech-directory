import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, Navigate, useParams } from 'react-router-dom';
import { MapPin, Scale, Landmark, HeartHandshake, ShieldCheck } from 'lucide-react';
import { ALL_STATES } from '../../../src/data/states';
import { loadCityIndex } from '@/src/utils/facilityIndex';
import { supabase } from '@/src/lib/supabase';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';

type CityStat = {
  city: string;
  count: number;
  slug: string;
};

export const StateHubHome: React.FC = () => {
  const { state } = useParams<{ state: string }>();
  const stateDef = ALL_STATES.find((s) => s.slug === state);
  const [cities, setCities] = useState<CityStat[]>([]);
  const [facilityCount, setFacilityCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!stateDef) return;
    let mounted = true;

    const fetchCities = async () => {
      setLoading(true);
      try {
        const cityIndex = await loadCityIndex();
        const stateCities = cityIndex
          .filter((entry) => entry.stateSlug === stateDef.slug)
          .map((entry) => ({
            city: entry.cityName,
            count: entry.count,
            slug: entry.citySlug,
          }))
          .sort((a, b) => a.city.localeCompare(b.city));

        if (!mounted) return;
        setCities(stateCities);
        setFacilityCount(stateCities.reduce((sum, entry) => sum + entry.count, 0));
        setLoading(false);
        return;
      } catch (err) {
        console.error('City index fallback to Supabase:', err);
      }

      try {
        const { data, error } = await supabase
          .from('facilities')
          .select('city')
          .eq('state', stateDef.abbreviation);

        if (error) throw error;
        const cityMap = new Map<string, number>();
        (data || []).forEach((row) => {
          const city = (row.city || '').trim();
          if (!city) return;
          cityMap.set(city, (cityMap.get(city) || 0) + 1);
        });

        if (!mounted) return;
        const computed: CityStat[] = Array.from(cityMap.entries())
          .map(([city, count]) => ({
            city,
            count,
            slug: city.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
          }))
          .sort((a, b) => a.city.localeCompare(b.city));
        setCities(computed);
        setFacilityCount((data || []).length);
      } catch (err) {
        console.error('Unable to load state cities:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchCities();
    return () => {
      mounted = false;
    };
  }, [stateDef]);

  const canonical = useMemo(() => {
    if (!stateDef) return 'https://silvertechdirectory.com/states';
    return `https://silvertechdirectory.com/states/${stateDef.slug}`;
  }, [stateDef]);

  if (!stateDef) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-warm-gray">
      <Helmet>
        <title>Assisted Living in {stateDef.name} | City Directory & State Resources</title>
        <meta
          name="description"
          content={`Browse assisted living cities in ${stateDef.name}, compare local options, and access state regulations, Medicaid, ombudsman, and veterans resources.`}
        />
        <link rel="canonical" href={canonical} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:url" content={canonical} />
      </Helmet>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'States', path: '/states' },
              { label: stateDef.name, path: `/states/${stateDef.slug}` },
            ]}
          />
          <h1 className="mt-6 text-3xl md:text-4xl font-bold text-slate-900">
            {stateDef.name} Assisted Living Hub
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Explore cities, compare local communities, and navigate state-level care regulations and support programs.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm text-slate-700">
            <MapPin className="h-4 w-4" />
            {loading ? 'Loading inventory...' : `${facilityCount.toLocaleString()} facilities across ${cities.length.toLocaleString()} cities`}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <Link to={`/states/${stateDef.slug}/regulations`} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm">
            <Scale className="h-5 w-5 text-slate-700" />
            <p className="mt-3 font-semibold text-slate-900">Regulations</p>
            <p className="text-sm text-slate-600 mt-1">Licensing standards and compliance references.</p>
          </Link>
          <Link to={`/states/${stateDef.slug}/medicaid`} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm">
            <Landmark className="h-5 w-5 text-slate-700" />
            <p className="mt-3 font-semibold text-slate-900">Medicaid</p>
            <p className="text-sm text-slate-600 mt-1">Waivers, eligibility context, and coverage routes.</p>
          </Link>
          <Link to={`/states/${stateDef.slug}/ombudsman`} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm">
            <HeartHandshake className="h-5 w-5 text-slate-700" />
            <p className="mt-3 font-semibold text-slate-900">Ombudsman</p>
            <p className="text-sm text-slate-600 mt-1">Resident-rights and complaint assistance contacts.</p>
          </Link>
          <Link to={`/states/${stateDef.slug}/veterans`} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-sm">
            <ShieldCheck className="h-5 w-5 text-slate-700" />
            <p className="mt-3 font-semibold text-slate-900">Veterans</p>
            <p className="text-sm text-slate-600 mt-1">Benefits and support programs for veterans.</p>
          </Link>
        </div>

        <section className="bg-white border border-slate-200 rounded-xl p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Browse Cities in {stateDef.name}</h2>
              <p className="text-slate-600 mt-1">Direct links to city-level assisted living pages.</p>
            </div>
            <Link
              to={`/search?state=${stateDef.slug}`}
              className="inline-flex min-h-11 items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Search All {stateDef.name}
            </Link>
          </div>

          {loading ? (
            <p className="text-slate-500">Loading city directory...</p>
          ) : cities.length === 0 ? (
            <p className="text-slate-500">No city inventory found yet for this state.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  to={`/assisted-living/${stateDef.slug}/cities/${city.slug}/`}
                  className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm hover:border-slate-400"
                >
                  <span className="font-medium text-slate-800 truncate pr-2">{city.city}</span>
                  <span className="text-xs rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{city.count}</span>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
