import React, { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { MapPin, ChevronRight } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ALL_STATES } from '@/src/data/states';
import { loadFacilityIndex } from '@/src/utils/facilityIndex';
import { buildCareTypePath, getCareTypeRouteLabel, isCareTypeRouteSlug } from '@/src/utils/facilityPath';

type StateSummary = {
  stateSlug: string;
  stateName: string;
  stateAbbr: string;
  facilityCount: number;
};

export const CareTypeDirectoryPage: React.FC = () => {
  const { careType } = useParams<{ careType: string }>();
  const [states, setStates] = useState<StateSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizedCareType = (careType || '').trim().toLowerCase();
  const careTypeLabel = getCareTypeRouteLabel(normalizedCareType);

  useEffect(() => {
    let mounted = true;

    const loadStates = async () => {
      if (!isCareTypeRouteSlug(normalizedCareType)) {
        setLoading(false);
        return;
      }

      try {
        const facilities = await loadFacilityIndex();
        const counts = new Map<string, StateSummary>();

        for (const facility of facilities) {
          const stateAbbr = (facility.state || '').trim().toUpperCase();
          if (!stateAbbr) continue;
          if ((facility.primary_care_type_slug || '').trim().toLowerCase() !== normalizedCareType) continue;

          const stateMeta = ALL_STATES.find((entry) => entry.abbreviation === stateAbbr);
          if (!stateMeta) continue;

          const existing = counts.get(stateMeta.slug);
          if (existing) {
            existing.facilityCount += 1;
            continue;
          }

          counts.set(stateMeta.slug, {
            stateSlug: stateMeta.slug,
            stateName: stateMeta.name,
            stateAbbr,
            facilityCount: 1,
          });
        }

        if (!mounted) return;
        setStates(
          Array.from(counts.values()).sort((a, b) => {
            if (b.facilityCount !== a.facilityCount) return b.facilityCount - a.facilityCount;
            return a.stateName.localeCompare(b.stateName);
          }),
        );
      } catch (error) {
        console.error('Error loading care-type directory:', error);
        if (mounted) setStates([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadStates();
    return () => {
      mounted = false;
    };
  }, [normalizedCareType]);

  if (!isCareTypeRouteSlug(normalizedCareType)) {
    return <Navigate to="/" replace />;
  }

  const canonicalUrl = `https://silvertechdirectory.com/${normalizedCareType}/`;
  const pageTitle = `${careTypeLabel} by State | SilverTech Directory`;
  const pageDescription = `Browse ${careTypeLabel.toLowerCase()} directories by state and compare licensed communities across the country.`;

  return (
    <div className="min-h-screen bg-warm-gray">
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
              { '@type': 'ListItem', position: 2, name: careTypeLabel, item: canonicalUrl },
            ],
          })}
        </script>
      </Helmet>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: careTypeLabel, path: `/${normalizedCareType}/` },
            ]}
          />
          <div className="mt-6 max-w-3xl">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Care Type Directory</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">{careTypeLabel} by state</h1>
            <p className="mt-4 text-lg text-slate-600">
              Browse clean state-level landing pages for {careTypeLabel.toLowerCase()} and drill into city markets from there.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
            Loading state coverage...
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {states.map((state) => (
              <Link
                key={state.stateSlug}
                to={buildCareTypePath({ careType: normalizedCareType, state: state.stateSlug })}
                className="group rounded-xl border border-slate-200 bg-white p-5 transition hover:border-slate-400 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs uppercase tracking-[0.2em]">{state.stateAbbr}</span>
                    </div>
                    <h2 className="mt-3 text-xl font-semibold text-slate-900 group-hover:text-primary-700">
                      {state.stateName}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600">
                      {state.facilityCount.toLocaleString()} primary {careTypeLabel.toLowerCase()} listing
                      {state.facilityCount === 1 ? '' : 's'}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-700" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
