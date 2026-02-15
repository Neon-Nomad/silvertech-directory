// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
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

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        order: () => ({
          limit: async () => ({ data: lineageRows, error: null }),
        }),
      }),
    }),
  },
}));

describe('FacilityLineageView', () => {
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
      expect(screen.getByText('No lineage rows found.')).toBeInTheDocument();
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
});
