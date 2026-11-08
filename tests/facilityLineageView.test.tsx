// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FacilityLineageView } from '@/features/operator/dashboard/FacilityLineageView';

const lineageRows = [
  {
    normalization_record_id: 'nr-1',
    raw_event_id: 're-1',
    source_system: 'web',
    occurred_at: '2026-02-15T12:00:00.000Z',
    normalization_status: 'normalized',
    processing_error: null,
    attempts: 1,
    canonical_record_id: 'cr-1',
    facility_id: 'f-1',
    facility_name: 'Golden Oaks',
    city: 'Austin',
    state: 'TX',
    profile_strength: 92,
    listing_authority_tier: 'authority',
    market_benchmark: {
      scope: 'zip',
      confidence: 'high',
      avg_monthly_rate: 4200,
      facility_count: 14,
    },
    last_processed_at: '2026-02-15T12:10:00.000Z',
  },
  {
    normalization_record_id: 'nr-2',
    raw_event_id: 're-2',
    source_system: 'api',
    occurred_at: '2026-02-01T12:00:00.000Z',
    normalization_status: 'rejected',
    processing_error: 'bad payload',
    attempts: 2,
    canonical_record_id: null,
    facility_id: 'f-2',
    facility_name: 'Harbor View',
    city: 'Dallas',
    state: 'TX',
    profile_strength: 45,
    listing_authority_tier: 'standard',
    market_benchmark: {
      scope: 'state',
      confidence: 'medium',
      avg_monthly_rate: 3800,
      facility_count: 7,
    },
    last_processed_at: '2026-02-01T12:10:00.000Z',
  },
];

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => mocks.rpc(...args),
    from: (...args: unknown[]) => mocks.from(...args),
  },
}));

describe('FacilityLineageView', () => {
  beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.from.mockReset();
    mocks.rpc.mockResolvedValue({ data: lineageRows, error: null });
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('filters by status and source', async () => {
    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByTestId('lineage-row-count')).toHaveTextContent('2');
    });

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'rejected' } });
    await waitFor(() => {
      expect(screen.getByTestId('lineage-row-count')).toHaveTextContent('1');
    });
    expect(screen.getByText('Harbor View')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Source'), { target: { value: 'web' } });
    await waitFor(() => {
      expect(screen.getByText('No vault records found.')).toBeInTheDocument();
    });
  });

  it('hydrates and persists filters through localStorage', async () => {
    window.localStorage.setItem(
      'std_lineage_filters_v1',
      JSON.stringify({
        facilityFilter: 'Golden',
        statusFilter: 'normalized',
        sourceFilter: 'web',
        fromDate: '2026-02-10',
        toDate: '2026-02-20',
      })
    );

    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Golden')).toBeInTheDocument();
    });
    expect(screen.getByLabelText('Status')).toHaveValue('normalized');
    expect(screen.getByLabelText('Source')).toHaveValue('web');
    expect(screen.getByLabelText('From')).toHaveValue('2026-02-10');
    expect(screen.getByLabelText('To')).toHaveValue('2026-02-20');

    fireEvent.change(screen.getByLabelText('Status'), { target: { value: 'rejected' } });
    const persisted = JSON.parse(window.localStorage.getItem('std_lineage_filters_v1') || '{}');
    expect(persisted.statusFilter).toBe('rejected');
  });

  it('exports filtered lineage rows to csv', async () => {
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    const revokeObjectUrlSpy = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByText('Golden Oaks')).toBeInTheDocument();
    });

    const exportButtons = screen.getAllByRole('button', { name: 'Export CSV' });
    fireEvent.click(exportButtons[0]);
    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrlSpy).toHaveBeenCalledWith('blob:test');

    createObjectUrlSpy.mockRestore();
    revokeObjectUrlSpy.mockRestore();
  });

  it('renders lineage rows and benchmark info', async () => {
    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByText('Golden Oaks')).toBeInTheDocument();
    });
    expect(screen.getAllByText('authority').length).toBeGreaterThan(0);
    expect(screen.getByText('$4,200')).toBeInTheDocument();
    expect(screen.getByText('Rows')).toBeInTheDocument();
  });

  it('persists Vault intro dismissal until manually reset', async () => {
    render(<FacilityLineageView />);

    expect(screen.getByTestId('vault-intro')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss Vault help' }));
    expect(screen.queryByTestId('vault-intro')).not.toBeInTheDocument();

    cleanup();
    render(<FacilityLineageView />);
    expect(screen.queryByTestId('vault-intro')).not.toBeInTheDocument();
  });

  it('loads through the operator RPC and never queries the view directly', async () => {
    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByText('Golden Oaks')).toBeInTheDocument();
    });
    expect(mocks.rpc).toHaveBeenCalledWith('get_operator_facility_lineage', { p_limit: 200 });
    expect(mocks.from).not.toHaveBeenCalled();
  });

  it('shows the server refusal for accounts that are neither operators nor staff', async () => {
    mocks.rpc.mockResolvedValueOnce({ data: null, error: { message: 'Not authorized to view facility lineage' } });

    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByText('Not authorized to view facility lineage')).toBeInTheDocument();
    });
    expect(screen.queryByText('Golden Oaks')).not.toBeInTheDocument();
  });

  it('renders operator rows whose trace fields and error text are null, without showing empty values', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          ...lineageRows[0],
          normalization_record_id: null,
          raw_event_id: null,
          canonical_record_id: null,
          processing_error: null,
          market_benchmark: { scope: 'zip', confidence: 'suppressed', facility_count: null, avg_monthly_rate: null },
        },
      ],
      error: null,
    });

    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByText('Golden Oaks')).toBeInTheDocument();
    });
    expect(screen.getByText('raw: --')).toBeInTheDocument();
    expect(screen.getByText('canonical: --')).toBeInTheDocument();
    expect(screen.queryByText('$4,200')).not.toBeInTheDocument();
    expect(screen.getByText(/suppressed/)).toBeInTheDocument();
    expect(screen.queryByText(/null|undefined/)).not.toBeInTheDocument();
  });

  it('exports operator rows to CSV with empty trace and benchmark cells, never the word null', async () => {
    mocks.rpc.mockResolvedValueOnce({
      data: [
        {
          ...lineageRows[0],
          normalization_record_id: null,
          raw_event_id: null,
          canonical_record_id: null,
          processing_error: null,
          market_benchmark: { scope: 'zip', confidence: 'suppressed', facility_count: null, avg_monthly_rate: null },
        },
      ],
      error: null,
    });
    const createObjectUrlSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

    render(<FacilityLineageView />);

    await waitFor(() => {
      expect(screen.getByText('Golden Oaks')).toBeInTheDocument();
    });
    fireEvent.click(screen.getAllByRole('button', { name: 'Export CSV' })[0]);

    expect(createObjectUrlSpy).toHaveBeenCalledTimes(1);
    const blob = createObjectUrlSpy.mock.calls[0][0] as Blob;
    const csv = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    expect(csv).toContain('"Golden Oaks"');
    expect(csv).not.toMatch(/\bnull\b|undefined/);
    createObjectUrlSpy.mockRestore();
  });
});
