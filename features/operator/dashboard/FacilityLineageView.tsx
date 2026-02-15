import React from 'react';
import { supabase } from '@/src/lib/supabase';
import { formatRelativeTime } from '@/src/utils/timeFormatting';
import { Button } from '@/components/ui/Button';

const LINEAGE_FILTERS_STORAGE_KEY = 'std_lineage_filters_v1';

type MarketBenchmark = {
  scope?: string | null;
  confidence?: string | null;
  avg_monthly_rate?: number | null;
  facility_count?: number | null;
};

type LineageRow = {
  normalization_record_id: string;
  raw_event_id: string;
  source_system: string | null;
  occurred_at: string | null;
  normalization_status: string | null;
  processing_error: string | null;
  attempts: number | null;
  canonical_record_id: string | null;
  facility_id: string | null;
  facility_name: string | null;
  city: string | null;
  state: string | null;
  profile_strength: number | null;
  listing_authority_tier: string | null;
  market_benchmark: MarketBenchmark | null;
  last_processed_at: string | null;
};

const trimId = (value: string | null | undefined): string => {
  if (!value) return '--';
  if (value.length <= 12) return value;
  return `${value.slice(0, 8)}...${value.slice(-4)}`;
};

const formatWhen = (value: string | null | undefined): string => {
  if (!value) return '--';
  return formatRelativeTime(value);
};

export const FacilityLineageView: React.FC = () => {
  const readStoredFilters = React.useCallback(() => {
    try {
      const raw = window.localStorage.getItem(LINEAGE_FILTERS_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        facilityFilter?: string;
        statusFilter?: 'all' | 'normalized' | 'rejected';
        sourceFilter?: 'all' | 'web' | 'dashboard' | 'api' | 'import' | 'manual' | 'stripe' | 'system';
        fromDate?: string;
        toDate?: string;
      };
      return parsed;
    } catch {
      return null;
    }
  }, []);

  const storedFilters = readStoredFilters();
  const [rows, setRows] = React.useState<LineageRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [facilityFilter, setFacilityFilter] = React.useState(storedFilters?.facilityFilter ?? '');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'normalized' | 'rejected'>(
    storedFilters?.statusFilter ?? 'all'
  );
  const [sourceFilter, setSourceFilter] = React.useState<
    'all' | 'web' | 'dashboard' | 'api' | 'import' | 'manual' | 'stripe' | 'system'
  >(storedFilters?.sourceFilter ?? 'all');
  const [fromDate, setFromDate] = React.useState(storedFilters?.fromDate ?? '');
  const [toDate, setToDate] = React.useState(storedFilters?.toDate ?? '');

  const loadLineage = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: fetchError } = await supabase
      .from('api_internal_facility_lineage')
      .select(
        'normalization_record_id,raw_event_id,source_system,occurred_at,normalization_status,processing_error,attempts,canonical_record_id,facility_id,facility_name,city,state,profile_strength,listing_authority_tier,market_benchmark,last_processed_at'
      )
      .order('last_processed_at', { ascending: false })
      .limit(200);

    if (fetchError) {
      setRows([]);
      setError(fetchError.message || 'Failed to load lineage data');
      setLoading(false);
      return;
    }

    setRows((data || []) as LineageRow[]);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    loadLineage();
  }, [loadLineage]);

  React.useEffect(() => {
    try {
      window.localStorage.setItem(
        LINEAGE_FILTERS_STORAGE_KEY,
        JSON.stringify({
          facilityFilter,
          statusFilter,
          sourceFilter,
          fromDate,
          toDate,
        })
      );
    } catch {
      // ignore storage write failures
    }
  }, [facilityFilter, statusFilter, sourceFilter, fromDate, toDate]);

  const filteredRows = React.useMemo(() => {
    const needle = facilityFilter.trim().toLowerCase();
    const fromMs = fromDate ? Date.parse(`${fromDate}T00:00:00.000Z`) : null;
    const toMs = toDate ? Date.parse(`${toDate}T23:59:59.999Z`) : null;

    return rows.filter((row) => {
      const name = row.facility_name?.toLowerCase() || '';
      const city = row.city?.toLowerCase() || '';
      const state = row.state?.toLowerCase() || '';
      const matchesText = !needle || name.includes(needle) || city.includes(needle) || state.includes(needle);
      const matchesStatus = statusFilter === 'all' || row.normalization_status === statusFilter;
      const matchesSource = sourceFilter === 'all' || row.source_system === sourceFilter;

      const timeValue = row.last_processed_at || row.occurred_at;
      const timeMs = timeValue ? Date.parse(timeValue) : null;
      const matchesFrom = fromMs === null || (timeMs !== null && timeMs >= fromMs);
      const matchesTo = toMs === null || (timeMs !== null && timeMs <= toMs);

      return matchesText && matchesStatus && matchesSource && matchesFrom && matchesTo;
    });
  }, [rows, facilityFilter, statusFilter, sourceFilter, fromDate, toDate]);

  const authorityCount = filteredRows.filter((row) => row.listing_authority_tier === 'authority').length;
  const rejectedCount = filteredRows.filter((row) => row.normalization_status === 'rejected').length;

  const exportCsv = React.useCallback(() => {
    const header = [
      'facility_name',
      'city',
      'state',
      'source_system',
      'normalization_status',
      'profile_strength',
      'authority_tier',
      'benchmark_scope',
      'benchmark_confidence',
      'benchmark_avg_monthly_rate',
      'benchmark_facility_count',
      'raw_event_id',
      'canonical_record_id',
      'last_processed_at',
    ];

    const escapeCell = (value: unknown): string => {
      if (value === null || value === undefined) return '';
      const text = String(value).replace(/"/g, '""');
      return `"${text}"`;
    };

    const lines = filteredRows.map((row) => {
      const benchmark = row.market_benchmark || {};
      return [
        row.facility_name,
        row.city,
        row.state,
        row.source_system,
        row.normalization_status,
        row.profile_strength,
        row.listing_authority_tier,
        benchmark.scope,
        benchmark.confidence,
        benchmark.avg_monthly_rate,
        benchmark.facility_count,
        row.raw_event_id,
        row.canonical_record_id,
        row.last_processed_at || row.occurred_at,
      ]
        .map(escapeCell)
        .join(',');
    });

    const csv = [header.join(','), ...lines].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `facility-lineage-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, [filteredRows]);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-charcoal">Facility Lineage</h2>
          <p className="text-charcoal/70">
            Internal trace from raw event to canonical listing authority state.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            value={facilityFilter}
            onChange={(event) => setFacilityFilter(event.target.value)}
            placeholder="Filter by facility, city, state..."
            className="min-h-11 rounded-md border border-warm-gray bg-white px-3 py-2 text-sm text-charcoal"
          />
          <label className="sr-only" htmlFor="lineage-status-filter">
            Status
          </label>
          <select
            id="lineage-status-filter"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}
            className="min-h-11 rounded-md border border-warm-gray bg-white px-3 py-2 text-sm text-charcoal"
          >
            <option value="all">All status</option>
            <option value="normalized">Normalized</option>
            <option value="rejected">Rejected</option>
          </select>
          <label className="sr-only" htmlFor="lineage-source-filter">
            Source
          </label>
          <select
            id="lineage-source-filter"
            value={sourceFilter}
            onChange={(event) => setSourceFilter(event.target.value as typeof sourceFilter)}
            className="min-h-11 rounded-md border border-warm-gray bg-white px-3 py-2 text-sm text-charcoal"
          >
            <option value="all">All source</option>
            <option value="web">Web</option>
            <option value="dashboard">Dashboard</option>
            <option value="api">API</option>
            <option value="import">Import</option>
            <option value="manual">Manual</option>
            <option value="stripe">Stripe</option>
            <option value="system">System</option>
          </select>
          <label className="text-xs text-charcoal/60" htmlFor="lineage-from-date">
            From
          </label>
          <input
            id="lineage-from-date"
            type="date"
            value={fromDate}
            onChange={(event) => setFromDate(event.target.value)}
            className="min-h-11 rounded-md border border-warm-gray bg-white px-3 py-2 text-sm text-charcoal"
          />
          <label className="text-xs text-charcoal/60" htmlFor="lineage-to-date">
            To
          </label>
          <input
            id="lineage-to-date"
            type="date"
            value={toDate}
            onChange={(event) => setToDate(event.target.value)}
            className="min-h-11 rounded-md border border-warm-gray bg-white px-3 py-2 text-sm text-charcoal"
          />
          <Button variant="outline" className="min-h-11" onClick={exportCsv}>
            Export CSV
          </Button>
          <Button variant="secondary" className="min-h-11" onClick={loadLineage}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-warm-gray bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-charcoal/60">Rows</p>
          <p data-testid="lineage-row-count" className="mt-1 text-2xl font-semibold text-charcoal">{filteredRows.length}</p>
        </div>
        <div className="rounded-lg border border-warm-gray bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-charcoal/60">Authority Tier</p>
          <p className="mt-1 text-2xl font-semibold text-charcoal">{authorityCount}</p>
        </div>
        <div className="rounded-lg border border-warm-gray bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-charcoal/60">Rejected</p>
          <p className="mt-1 text-2xl font-semibold text-charcoal">{rejectedCount}</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="rounded-lg border border-warm-gray bg-white p-8 text-center text-charcoal/70">
          Loading lineage...
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-warm-gray bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-warm-gray/40 text-charcoal/70">
              <tr>
                <th className="px-4 py-3 font-semibold">Facility</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Profile</th>
                <th className="px-4 py-3 font-semibold">Benchmark</th>
                <th className="px-4 py-3 font-semibold">Lineage IDs</th>
                <th className="px-4 py-3 font-semibold">Updated</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const benchmark = row.market_benchmark || {};
                return (
                  <tr key={row.normalization_record_id} className="border-t border-warm-gray/60 align-top">
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">{row.facility_name || '--'}</p>
                      <p className="text-xs text-charcoal/60">
                        {[row.city, row.state].filter(Boolean).join(', ') || '--'}
                      </p>
                      <p className="text-xs text-charcoal/60">source: {row.source_system || '--'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">{row.normalization_status || '--'}</p>
                      <p className="text-xs text-charcoal/60">attempts: {row.attempts ?? 0}</p>
                      {row.processing_error && (
                        <p className="mt-1 text-xs text-red-700">{row.processing_error}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">{row.profile_strength ?? 0}/100</p>
                      <p className="text-xs text-charcoal/60">{row.listing_authority_tier || 'standard'}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-charcoal">
                        {benchmark.avg_monthly_rate ? `$${Number(benchmark.avg_monthly_rate).toLocaleString()}` : '--'}
                      </p>
                      <p className="text-xs text-charcoal/60">
                        {benchmark.scope || 'none'} | {benchmark.confidence || 'insufficient'} | n=
                        {benchmark.facility_count ?? 0}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal/70">
                      <p>raw: {trimId(row.raw_event_id)}</p>
                      <p>canonical: {trimId(row.canonical_record_id)}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-charcoal/70">
                      <p>{formatWhen(row.last_processed_at || row.occurred_at)}</p>
                    </td>
                  </tr>
                );
              })}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-charcoal/60">
                    No lineage rows found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};
