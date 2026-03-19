import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ChevronRight, MapPin } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';
import { ALL_STATES } from '@/src/data/states';
import { buildCareTypePath, buildRegulationsPath, getCareTypeRouteLabel, isCareTypeRouteSlug } from '@/src/utils/facilityPath';
import { loadFacilityIndexWithOptions } from '@/src/utils/facilityIndex';

type CityStat = {
  city: string;
  slug: string;
  count: number;
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const StatePageTemplate: React.FC = () => {
  const { careType, state } = useParams<{ careType: string; state: string }>();
  const normalizedCareType = (careType || '').trim().toLowerCase();
  const stateDef = ALL_STATES.find((entry) => entry.slug === (state || '').trim().toLowerCase());
  const [cities, setCities] = useState<CityStat[]>([]);
  const [facilityCount, setFacilityCount] = useState(0);
  const [phoneCoveragePct, setPhoneCoveragePct] = useState(0);
  const [websiteCoveragePct, setWebsiteCoveragePct] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadStateDirectory = async () => {
      if (!stateDef || !isCareTypeRouteSlug(normalizedCareType)) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const index = await loadFacilityIndexWithOptions({ stateAbbr: stateDef.abbreviation });
        const scoped = index.filter(
          (facility) =>
            (facility.state || '').trim().toUpperCase() === stateDef.abbreviation &&
            (facility.primary_care_type_slug || '').trim().toLowerCase() === normalizedCareType,
        );

        const cityMap = new Map<string, CityStat>();
        let withPhone = 0;
        let withWebsite = 0;

        for (const facility of scoped) {
          const cityName = (facility.city || '').trim();
          const citySlug = toSlug(cityName);
          if (!cityName || !citySlug) continue;

          if (facility.phone) withPhone += 1;
          if (facility.website_url) withWebsite += 1;

          const existing = cityMap.get(citySlug);
          if (existing) {
            existing.count += 1;
            continue;
          }

          cityMap.set(citySlug, {
            city: cityName,
            slug: citySlug,
            count: 1,
          });
        }

        if (!mounted) return;
        setFacilityCount(scoped.length);
        setPhoneCoveragePct(scoped.length > 0 ? Math.round((withPhone / scoped.length) * 100) : 0);
        setWebsiteCoveragePct(scoped.length > 0 ? Math.round((withWebsite / scoped.length) * 100) : 0);
        setCities(
          Array.from(cityMap.values()).sort((a, b) => {
            if (b.count !== a.count) return b.count - a.count;
            return a.city.localeCompare(b.city);
          }),
        );
      } catch (error) {
        console.error('Error loading care-type state page:', error);
        if (mounted) {
          setCities([]);
          setFacilityCount(0);
          setPhoneCoveragePct(0);
          setWebsiteCoveragePct(0);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadStateDirectory();
    return () => {
      mounted = false;
    };
  }, [normalizedCareType, stateDef]);

  if (!stateDef || !isCareTypeRouteSlug(normalizedCareType)) {
    return <Navigate to="/" replace />;
  }

  const careTypeLabel = getCareTypeRouteLabel(normalizedCareType);
  const canonicalUrl = `https://silvertechdirectory.com/${normalizedCareType}/${stateDef.slug}/`;
  const pageTitle = `${careTypeLabel} in ${stateDef.name} | SilverTech Directory`;
  const pageDescription = `Explore ${careTypeLabel.toLowerCase()} listings across ${stateDef.name}, including city-level directories and regulatory resources.`;

  const breadcrumbItems = [
    { label: 'Home', path: '/' },
    { label: careTypeLabel, path: `/${normalizedCareType}/` },
    { label: stateDef.name, path: buildCareTypePath({ careType: normalizedCareType, state: stateDef.slug }) },
  ];

  const itemListSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: cities.slice(0, 24).map((city, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: `${careTypeLabel} in ${city.city}, ${stateDef.abbreviation}`,
        item: `https://silvertechdirectory.com${buildCareTypePath({
          careType: normalizedCareType,
          state: stateDef.slug,
          city: city.slug,
        })}`,
      })),
    }),
    [careTypeLabel, cities, normalizedCareType, stateDef.abbreviation, stateDef.slug],
  );

  return (
    <div className="min-h-screen bg-warm-gray font-sans text-slate-900">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="canonical" href={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="SilverTech Directory" />
        <meta property="og:title" content={pageTitle} />
        <meta property="og:description" content={pageDescription} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content="https://silvertechdirectory.com/hero.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={pageTitle} />
        <meta name="twitter:description" content={pageDescription} />
        <meta name="twitter:image" content="https://silvertechdirectory.com/hero.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://silvertechdirectory.com/' },
              { '@type': 'ListItem', position: 2, name: careTypeLabel, item: `https://silvertechdirectory.com/${normalizedCareType}/` },
              { '@type': 'ListItem', position: 3, name: stateDef.name, item: canonicalUrl },
            ],
          })}
        </script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs items={breadcrumbItems} />
          <div className="mt-6 max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">State Directory</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">
              {careTypeLabel} in {stateDef.name}
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Browse city-level {careTypeLabel.toLowerCase()} pages in {stateDef.name} and move directly into canonical Astro facility profiles.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <ContentMeta />
        <div className="mt-3">
          <DataSourceNote />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-3xl font-bold text-slate-900">{loading ? '...' : facilityCount.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-600">{careTypeLabel} listings</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-3xl font-bold text-slate-900">{loading ? '...' : cities.length.toLocaleString()}</p>
            <p className="mt-2 text-sm text-slate-600">Cities covered</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-3xl font-bold text-slate-900">{loading ? '...' : `${phoneCoveragePct}%`}</p>
            <p className="mt-2 text-sm text-slate-600">Listings with phone numbers</p>
          </div>
        </div>

        <div className="mb-10 rounded-xl border border-slate-200 bg-white p-6">
          <h2 className="text-2xl font-bold text-slate-900">Statewide overview</h2>
          <p className="mt-3 text-slate-600">
            SilverTech currently tracks {loading ? '...' : facilityCount.toLocaleString()} primary {careTypeLabel.toLowerCase()} listings in {stateDef.name}.
            Use the city directories below to drill into local markets, then compare communities on canonical Astro facility pages.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={buildRegulationsPath(stateDef.slug)}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            >
              View {stateDef.name} regulations
            </Link>
            <Link to="/search" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700">
              Search all communities
            </Link>
          </div>
          <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-600">
            <span>Website coverage: {loading ? '...' : `${websiteCoveragePct}%`}</span>
            <span>Canonical route: `/{normalizedCareType}/{stateDef.slug}/`</span>
          </div>
        </div>

        <div className="mb-10">
          <h2 className="text-2xl font-bold text-slate-900 mb-5">Top cities in {stateDef.name}</h2>
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">Loading city directories...</div>
          ) : cities.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-slate-500">
              No primary {careTypeLabel.toLowerCase()} listings are available in this state yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {cities.slice(0, 12).map((city) => (
                <Link
                  key={city.slug}
                  to={buildCareTypePath({ careType: normalizedCareType, state: stateDef.slug, city: city.slug })}
                  className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-md"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <MapPin className="h-4 w-4" />
                        <span className="text-xs uppercase tracking-[0.2em]">{stateDef.abbreviation}</span>
                      </div>
                      <h3 className="mt-3 text-xl font-semibold text-slate-900 group-hover:text-primary-700">{city.city}</h3>
                      <p className="mt-2 text-sm text-slate-600">
                        {city.count.toLocaleString()} listing{city.count === 1 ? '' : 's'}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {cities.length > 12 && (
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-2xl font-bold text-slate-900 mb-5">All cities in {stateDef.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {cities.map((city) => (
                <Link
                  key={city.slug}
                  to={buildCareTypePath({ careType: normalizedCareType, state: stateDef.slug, city: city.slug })}
                  className="rounded-lg border border-slate-200 px-4 py-3 text-sm text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
                >
                  <span className="font-medium">{city.city}</span>
                  <span className="ml-2 text-slate-500">{city.count}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
