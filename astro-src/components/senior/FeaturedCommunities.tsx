import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

type CareTypeSlug =
  | 'assisted-living'
  | 'memory-care'
  | 'nursing-homes'
  | 'independent-living'
  | 'residential-care'
  | 'adult-day-services'
  | 'ccrc';

type Facility = {
  id: string;
  name: string;
  city: string;
  state: string;
  address_line1?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  website_url?: string | null;
  google_maps_url?: string | null;
  listing_tier?: string | null;
};

type FacilityQueryRow = Facility & {
  facility_care_types?: Array<{
    care_types?: { slug?: string | null } | null;
  }> | null;
};

type Props = {
  stateAbbr: string;
  cityName: string;
  careType?: CareTypeSlug;
};

const tierLabel = (tier: string | null | undefined): string => {
  if (tier === 'accelerator') return 'Accelerator';
  if (tier === 'dominator') return 'Dominator';
  return 'Featured';
};

const shuffleRows = <T,>(input: T[]): T[] => {
  const rows = [...input];
  for (let i = rows.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return rows;
};

const rotateRows = (input: Facility[]): Facility[] => {
  if (input.length <= 1) return input;
  const maxCards = Math.min(3, input.length);
  const minCards = Math.min(2, maxCards);
  const target = minCards + Math.floor(Math.random() * (maxCards - minCards + 1));
  return shuffleRows(input).slice(0, target);
};

export default function FeaturedCommunities({ stateAbbr, cityName, careType }: Props) {
  const [rows, setRows] = useState<Facility[]>([]);
  const [ready, setReady] = useState(false);

  const supabase = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) return null;
    return createClient(supabaseUrl, supabaseAnonKey);
  }, []);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!supabase) {
        if (mounted) setReady(true);
        return;
      }

      const { data, error } = await supabase
        .from('facilities')
        .select(
          `
            id,
            name,
            city,
            state,
            address_line1,
            postal_code,
            phone,
            website_url,
            google_maps_url,
            listing_tier,
            facility_care_types(
              care_types(slug)
            )
          `,
        )
        .eq('state', stateAbbr.toUpperCase())
        .ilike('city', cityName)
        .in('listing_tier', ['accelerator', 'dominator'])
        .limit(36);

      if (mounted) {
        if (error) {
          setRows([]);
          setReady(true);
          return;
        }

        const sourceRows = ((data as FacilityQueryRow[]) || []).filter((row) => Boolean(row.id));
        const careFiltered = careType
          ? sourceRows.filter((row) =>
              (row.facility_care_types || []).some(
                (item) => (item?.care_types?.slug || '').toLowerCase() === careType,
              ),
            )
          : sourceRows;

        const deduped = Array.from(
          new Map(
            careFiltered.map((row) => [
              row.id,
              {
                id: row.id,
                name: row.name,
                city: row.city,
                state: row.state,
                address_line1: row.address_line1,
                postal_code: row.postal_code,
                phone: row.phone,
                website_url: row.website_url,
                google_maps_url: row.google_maps_url,
                listing_tier: row.listing_tier,
              } as Facility,
            ]),
          ).values(),
        );

        setRows(rotateRows(deduped));
        setReady(true);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, [careType, cityName, stateAbbr, supabase]);

  if (!ready || rows.length === 0) return null;

  return (
    <section className="sl-featured-block">
      <div className="sl-section-head">
        <h2>Featured Communities</h2>
        <span className="sl-premium-tag">Premium Placement</span>
      </div>
      <div className="sl-featured-grid">
        {rows.map((facility) => {
          const mapUrl =
            facility.google_maps_url ||
            `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
              `${facility.name} ${facility.city} ${facility.state}`,
            )}`;
          const searchHref = `/search?state=${encodeURIComponent(
            facility.state,
          )}&city=${encodeURIComponent(facility.city)}&q=${encodeURIComponent(facility.name)}`;

          return (
            <article key={facility.id} className="sl-featured-card">
              <div className="sl-featured-top">
                <h3>{facility.name}</h3>
                <span className="sl-verified-pill">SilverTech Verified</span>
              </div>
              <p className="sl-muted">
                {[facility.address_line1, `${facility.city}, ${facility.state} ${facility.postal_code || ''}`]
                  .filter(Boolean)
                  .join(', ')}
              </p>
              <div className="sl-featured-meta">
                <span>{tierLabel(facility.listing_tier)}</span>
                {facility.phone && <a href={`tel:${facility.phone}`}>Call</a>}
                {facility.website_url && (
                  <a href={facility.website_url} target="_blank" rel="noopener noreferrer nofollow">
                    Website
                  </a>
                )}
              </div>
              <div className="sl-featured-actions">
                <a className="sl-btn sl-btn-primary" href={searchHref}>
                  View Details
                </a>
                <a className="sl-btn sl-btn-secondary" href={mapUrl} target="_blank" rel="noopener noreferrer nofollow">
                  Map
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
