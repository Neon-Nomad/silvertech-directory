import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Building2, MapPin, Phone, Shield } from 'lucide-react';
import { Breadcrumbs } from '@/components/ui/Breadcrumbs';
import { ContentMeta } from '@/components/ui/ContentMeta';
import { DataSourceNote } from '@/components/ui/DataSourceNote';
import { HospitalList } from '@/features/locations/HospitalList';
import { ALL_STATES } from '@/src/data/states';
import { getHospitalsByCity, Hospital } from '@/src/utils/hospitalData';
import { buildCareTypePath, buildFacilityDetailPath, buildRegulationsPath, getCareTypeRouteLabel, isCareTypeRouteSlug } from '@/src/utils/facilityPath';
import { loadFacilityIndexWithOptions } from '@/src/utils/facilityIndex';

type PublicFacility = {
  id: string;
  name: string;
  city: string;
  state: string;
  address_line1?: string;
  postal_code?: string;
  phone?: string;
  website_url?: string;
  public_slug?: string;
  public_route_id?: number;
};

const formatName = (slug: string) =>
  slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const CityPageTemplate: React.FC = () => {
  const { careType, state, city } = useParams<{ careType: string; state: string; city: string }>();
  const normalizedCareType = (careType || '').trim().toLowerCase();
  const stateDef = ALL_STATES.find((entry) => entry.slug === (state || '').trim().toLowerCase());
  const citySlug = (city || '').trim().toLowerCase();
  const cityName = formatName(citySlug);
  const [facilities, setFacilities] = useState<PublicFacility[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadCityDirectory = async () => {
      if (!stateDef || !isCareTypeRouteSlug(normalizedCareType) || !citySlug) {
        if (mounted) setLoading(false);
        return;
      }

      try {
        const index = await loadFacilityIndexWithOptions({ stateAbbr: stateDef.abbreviation });
        const scoped = index
          .filter(
            (facility) =>
              (facility.state || '').trim().toUpperCase() === stateDef.abbreviation &&
              toSlug(facility.city || '') === citySlug &&
              (facility.primary_care_type_slug || '').trim().toLowerCase() === normalizedCareType,
          )
          .sort((a, b) => a.name.localeCompare(b.name));

        const cityHospitals = await getHospitalsByCity(stateDef.abbreviation, cityName);

        if (!mounted) return;
        setFacilities(scoped);
        setHospitals(cityHospitals);
      } catch (error) {
        console.error('Error loading care-type city page:', error);
        if (mounted) {
          setFacilities([]);
          setHospitals([]);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void loadCityDirectory();
    return () => {
      mounted = false;
    };
  }, [cityName, citySlug, normalizedCareType, stateDef]);

  if (!stateDef || !isCareTypeRouteSlug(normalizedCareType) || !citySlug) {
    return <Navigate to="/" replace />;
  }

  const careTypeLabel = getCareTypeRouteLabel(normalizedCareType);
  const canonicalUrl = `https://silvertechdirectory.com/${normalizedCareType}/${stateDef.slug}/${citySlug}/`;
  const pageTitle = `${careTypeLabel} in ${cityName}, ${stateDef.abbreviation} | SilverTech Directory`;
  const pageDescription = `Compare ${careTypeLabel.toLowerCase()} communities in ${cityName}, ${stateDef.name} and open clean community profiles for verified facility details.`;

  const itemListSchema = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      itemListElement: facilities.map((facility, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'MedicalBusiness',
          name: facility.name,
          url: `https://silvertechdirectory.com${buildFacilityDetailPath({
            id: facility.id,
            publicSlug: facility.public_slug,
            publicRouteId: facility.public_route_id,
            careType: normalizedCareType,
            state: stateDef.slug,
            city: citySlug,
          })}`,
          telephone: facility.phone || undefined,
          address: {
            '@type': 'PostalAddress',
            streetAddress: facility.address_line1 || undefined,
            addressLocality: facility.city,
            addressRegion: facility.state,
            postalCode: facility.postal_code || undefined,
            addressCountry: 'US',
          },
        },
      })),
    }),
    [facilities],
  );

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
              { '@type': 'ListItem', position: 2, name: careTypeLabel, item: `https://silvertechdirectory.com/${normalizedCareType}/` },
              { '@type': 'ListItem', position: 3, name: stateDef.name, item: `https://silvertechdirectory.com/${normalizedCareType}/${stateDef.slug}/` },
              { '@type': 'ListItem', position: 4, name: cityName, item: canonicalUrl },
            ],
          })}
        </script>
        <script type="application/ld+json">{JSON.stringify(itemListSchema)}</script>
      </Helmet>

      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: careTypeLabel, path: `/${normalizedCareType}/` },
              { label: stateDef.name, path: buildCareTypePath({ careType: normalizedCareType, state: stateDef.slug }) },
              { label: cityName, path: buildCareTypePath({ careType: normalizedCareType, state: stateDef.slug, city: citySlug }) },
            ]}
          />
          <div className="mt-6 max-w-4xl">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">City Directory</p>
            <h1 className="mt-3 text-4xl font-bold text-slate-900">
              {careTypeLabel} in {cityName}, {stateDef.abbreviation}
            </h1>
            <p className="mt-4 text-lg text-slate-600">
              Review local communities, compare facility details, and move directly into canonical Astro facility profiles.
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                <span>{loading ? '...' : facilities.length.toLocaleString()} listings</span>
                <span>{loading ? '...' : facilities.filter((facility) => Boolean(facility.phone)).length.toLocaleString()} with phone</span>
                <span>{loading ? '...' : facilities.filter((facility) => Boolean(facility.website_url)).length.toLocaleString()} with website</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link
                  to={buildRegulationsPath(stateDef.slug)}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                >
                  View {stateDef.name} regulations
                </Link>
                <Link
                  to={buildCareTypePath({ careType: normalizedCareType, state: stateDef.slug })}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
                >
                  Browse all {stateDef.name} cities
                </Link>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                Loading communities in {cityName}...
              </div>
            ) : facilities.length === 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500">
                No primary {careTypeLabel.toLowerCase()} listings are available in {cityName} yet.
              </div>
            ) : (
              facilities.map((facility) => (
                <article key={facility.id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="flex-1">
                      <h2 className="text-2xl font-semibold text-slate-900">
                        <Link
                          to={buildFacilityDetailPath({
                            id: facility.id,
                            publicSlug: facility.public_slug,
                            publicRouteId: facility.public_route_id,
                            careType: normalizedCareType,
                            state: stateDef.slug,
                            city: citySlug,
                          })}
                          className="hover:text-primary-700"
                        >
                          {facility.name}
                        </Link>
                      </h2>
                      <div className="mt-3 space-y-2 text-sm text-slate-600">
                        <p className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 mt-0.5" />
                          <span>
                            {facility.address_line1 ? `${facility.address_line1}, ` : ''}
                            {facility.city}, {facility.state} {facility.postal_code || ''}
                          </span>
                        </p>
                        {facility.phone && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{facility.phone}</span>
                          </p>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                          {careTypeLabel}
                        </span>
                        {facility.website_url && (
                          <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary-700">
                            Website listed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 md:items-end">
                      <Link
                        to={buildFacilityDetailPath({
                          id: facility.id,
                          publicSlug: facility.public_slug,
                          publicRouteId: facility.public_route_id,
                          careType: normalizedCareType,
                          state: stateDef.slug,
                          city: citySlug,
                        })}
                        className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
                      >
                        View community
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-primary-700 mt-0.5" />
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">Clean canonical paths</h2>
                  <p className="mt-2 text-sm text-slate-600">
                    All public facility links on this page point directly to canonical Astro facility paths.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Nearby healthcare</h2>
              <HospitalList hospitals={hospitals} cityName={cityName} />
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Continue browsing</h2>
              <div className="space-y-3 text-sm">
                <Link
                  to={buildCareTypePath({ careType: normalizedCareType, state: stateDef.slug })}
                  className="flex items-center gap-2 text-slate-700 hover:text-primary-700"
                >
                  <Building2 className="h-4 w-4" />
                  All {careTypeLabel.toLowerCase()} in {stateDef.name}
                </Link>
                <Link to={buildRegulationsPath(stateDef.slug)} className="flex items-center gap-2 text-slate-700 hover:text-primary-700">
                  <Building2 className="h-4 w-4" />
                  {stateDef.name} regulations
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
