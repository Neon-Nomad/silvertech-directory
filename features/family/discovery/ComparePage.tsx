import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { supabase } from '@/src/lib/supabase';
import { useComparison } from '@/src/context/ComparisonContext';
import { buildFacilityDetailPath } from '@/src/utils/facilityPath';
import { buildCompareRows, cellText, type CompareRecord } from '@/src/utils/comparisonModel';

type FacilityRow = {
  id: string;
  name: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  website_url: string | null;
  public_slug: string | null;
  public_route_id: number | null;
  primary_care_type_slug: string | null;
  facility_licensing: Array<{ license_number: string | null; bed_capacity: number | null }> | null;
  facility_care_types: Array<{ care_types: { name: string | null } | Array<{ name: string | null }> | null }> | null;
};

const careTypeNames = (row: FacilityRow): string[] =>
  (row.facility_care_types || []).flatMap((entry) => {
    const types = Array.isArray(entry.care_types) ? entry.care_types : entry.care_types ? [entry.care_types] : [];
    return types.map((type) => type.name || '').filter(Boolean);
  });

const toRecord = (row: FacilityRow): CompareRecord => {
  const licensing = (row.facility_licensing || []).find((entry) => entry.license_number) || row.facility_licensing?.[0];
  return {
    id: row.id,
    name: row.name,
    address_line1: row.address_line1,
    city: row.city,
    state: row.state,
    postal_code: row.postal_code,
    phone: row.phone,
    website_url: row.website_url,
    careTypes: careTypeNames(row),
    licenseNumber: licensing?.license_number ?? null,
    bedCapacity: licensing?.bed_capacity ?? null,
  };
};

const emptyRecord = (id: string): CompareRecord => ({
  id,
  name: null,
  address_line1: null,
  city: null,
  state: null,
  postal_code: null,
  phone: null,
  website_url: null,
  careTypes: [],
  licenseNumber: null,
  bedCapacity: null,
});

const ComparePage: React.FC = () => {
  const { selectedFacilities, removeFromCompare, clearComparison } = useComparison();
  const [rows, setRows] = useState<Map<string, FacilityRow>>(new Map());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selectedIds = useMemo(() => selectedFacilities.map((f) => f.id), [selectedFacilities]);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setRows(new Map());
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void (async () => {
      const { data, error: queryError } = await supabase
        .from('facilities')
        .select(
          'id,name,address_line1,city,state,postal_code,phone,website_url,public_slug,public_route_id,primary_care_type_slug,facility_licensing(license_number,bed_capacity),facility_care_types(care_types(name))',
        )
        .in('id', selectedIds);
      if (cancelled) return;
      if (queryError) {
        setError('We could not load these facilities. Please try again.');
      } else {
        setRows(new Map(((data as FacilityRow[] | null) || []).map((row) => [row.id, row])));
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedIds]);

  // Columns follow the order the family selected. A facility that did not load is listed as unavailable.
  // One record per column, so every cell stays under the right facility even when one did not load.
  const columns = selectedIds.map((id) => ({ id, row: rows.get(id) || null }));
  const records: CompareRecord[] = columns.map(({ id, row }) => (row ? toRecord(row) : emptyRecord(id)));
  const tableRows = buildCompareRows(records);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 text-charcoal">
      <Helmet>
        <title>Compare senior living facilities | SilverTech Directory</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <h1 className="font-serif text-3xl font-semibold">Compare facilities</h1>

      {selectedIds.length === 0 ? (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-base">No facilities are selected yet.</p>
          <p className="mt-2 text-sm text-charcoal/70">
            Use <strong>Add to compare</strong> on search results to choose up to three facilities.
          </p>
          <Link className="mt-4 inline-block font-bold underline" to="/search">
            Search facilities
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <span>
              Comparing {selectedIds.length} of 3
              {selectedIds.length === 1 ? ' (add at least one more to compare)' : ''}
            </span>
            <button type="button" className="font-bold underline" onClick={clearComparison}>
              Clear all
            </button>
            <Link className="font-bold underline" to="/search">
              Add more facilities
            </Link>
          </div>

          {loading && <p className="mt-6 text-sm text-charcoal/70">Loading verified details…</p>}
          {error && (
            <p role="alert" className="mt-6 text-sm text-red-700">
              {error}
            </p>
          )}

          {!loading && !error && (
            <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white">
              <table className="min-w-full border-collapse text-left text-sm">
                <caption className="sr-only">Facilities compared side by side</caption>
                <thead>
                  <tr>
                    <th scope="col" className="sticky left-0 z-10 w-40 bg-white p-3 align-bottom font-semibold">
                      Detail
                    </th>
                    {columns.map(({ id, row }) => {
                      const record = row ? toRecord(row) : null;
                      const path =
                        row &&
                        buildFacilityDetailPath({
                          id: row.id,
                          publicSlug: row.public_slug,
                          publicRouteId: row.public_route_id,
                          careType: row.primary_care_type_slug,
                          state: row.state,
                          city: row.city,
                        });
                      return (
                        <th key={id} scope="col" className="min-w-[14rem] p-3 align-bottom font-semibold">
                          {record && path ? (
                            <Link className="underline" to={path}>
                              {record.name || 'Facility'}
                            </Link>
                          ) : (
                            <span className="font-normal text-charcoal/70">Details unavailable</span>
                          )}
                          <div>
                            <button
                              type="button"
                              className="mt-2 text-xs font-bold uppercase tracking-wide underline"
                              aria-label={`Remove ${record?.name || 'facility'} from comparison`}
                              onClick={() => removeFromCompare(id)}
                            >
                              Remove
                            </button>
                          </div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr key={row.key} className="border-t border-slate-200">
                      <th scope="row" className="sticky left-0 z-10 bg-white p-3 align-top font-semibold">
                        {row.label}
                      </th>
                      {row.cells.map((cell, index) => {
                        const isMissing = cell === null;
                        return (
                          <td
                            key={`${row.key}-${columns[index]?.id ?? index}`}
                            className={`p-3 align-top ${isMissing ? 'text-charcoal/70' : ''}`}
                          >
                            {row.isLink && cell ? (
                              <a className="underline break-all" href={cell} target="_blank" rel="noopener noreferrer">
                                {cell}
                              </a>
                            ) : (
                              cellText(cell)
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <p className="mt-4 text-xs text-charcoal/70">
            "Not listed" means the information is not in our verified records. We do not estimate prices, ratings, or
            amenities. Ask the facility directly for those details.
          </p>
        </>
      )}
    </div>
  );
};

export default ComparePage;
