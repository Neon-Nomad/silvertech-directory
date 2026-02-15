// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { LeadsView } from '@/features/operator/dashboard/LeadsView';

type MockState = {
  facilities: Array<{ id: string }>;
  leads: any[];
  signals: any[];
  benchmark: Array<{ your_signals_week: number; peer_avg_week: number }>;
  funnel: Array<any>;
  health: any[];
};

const mockState: MockState = {
  facilities: [{ id: 'f-1' }],
  leads: [],
  signals: [],
  benchmark: [{ your_signals_week: 5, peer_avg_week: 4 }],
  funnel: [],
  health: [],
};

vi.mock('@/src/context/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'u-1' } }),
}));

vi.mock('@/src/hooks/useOperatorPlan', () => ({
  useOperatorPlan: () => ({ plan: 'basic', isPremium: false, loading: false }),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'facilities') {
        return {
          select: () => ({
            eq: async () => ({ data: mockState.facilities, error: null }),
          }),
        };
      }

      if (table === 'leads') {
        return {
          select: () => ({
            in: () => ({
              order: async () => ({ data: mockState.leads, error: null }),
            }),
          }),
        };
      }

      if (table === 'lead_events') {
        return {
          select: () => ({
            in: () => ({
              order: () => ({
                limit: async () => ({ data: mockState.signals, error: null }),
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table mock: ${table}`);
    },
    rpc: async (name: string) => {
      if (name === 'get_operator_signal_benchmark') return { data: mockState.benchmark, error: null };
      if (name === 'get_operator_attribution_funnel') return { data: mockState.funnel, error: null };
      if (name === 'get_operator_profile_health') return { data: mockState.health, error: null };
      return { data: null, error: null };
    },
  },
}));

describe('LeadsView confidence states', () => {
  beforeEach(() => {
    window.localStorage.clear();
    mockState.funnel = [
      {
        impressions: 10,
        engagement: 4,
        intent: 2,
        conversions: 1,
        prev_impressions: 8,
        prev_engagement: 3,
        prev_intent: 1,
        prev_conversions: 1,
        phone_reveals: 0,
        tour_requests: 1,
        directions: 0,
        comparisons: 0,
      },
    ];
    mockState.health = [
      {
        facility_id: 'f-1',
        has_photos: true,
        has_care_types: true,
        has_phone: true,
        has_verified_phone: true,
        has_website_url: true,
        has_licensing: true,
        qa_response_rate: 1,
      },
    ];
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('shows Gathering Insights for ROI when below confidence threshold', async () => {
    render(<LeadsView />);

    await waitFor(() => {
      expect(screen.getByText('Gathering Insights')).toBeInTheDocument();
    });
    expect(screen.queryByText(/\$1,125/)).not.toBeInTheDocument();
  });

  it('shows ROI value and hides placeholder when confidence threshold is met', async () => {
    mockState.funnel = [
      {
        impressions: 10,
        engagement: 4,
        intent: 6,
        conversions: 5,
        prev_impressions: 8,
        prev_engagement: 3,
        prev_intent: 2,
        prev_conversions: 1,
        phone_reveals: 0,
        tour_requests: 5,
        directions: 0,
        comparisons: 0,
      },
    ];

    render(<LeadsView />);

    await waitFor(() => {
      expect(screen.getByText('$1,125')).toBeInTheDocument();
    });
    expect(screen.queryByText('Gathering Insights')).not.toBeInTheDocument();
    expect(screen.getAllByLabelText('How is this calculated?').length).toBeGreaterThan(0);
    expect(screen.queryByText('Technical details')).not.toBeInTheDocument();
    expect(screen.getAllByText('Open full methodology').length).toBeGreaterThan(0);
  });

  it('shows safe-zone warning badge when baseline is outside safe range', async () => {
    window.localStorage.setItem('std_roi_baseline_pct', '18');
    mockState.funnel = [
      {
        impressions: 10,
        engagement: 4,
        intent: 6,
        conversions: 5,
        prev_impressions: 8,
        prev_engagement: 3,
        prev_intent: 2,
        prev_conversions: 1,
        phone_reveals: 0,
        tour_requests: 5,
        directions: 0,
        comparisons: 0,
      },
    ];

    render(<LeadsView />);

    await waitFor(() => {
      expect(screen.getByText('Custom Baseline Applied')).toBeInTheDocument();
    });
  });

  it('does not show safe-zone warning badge when baseline is inside safe range', async () => {
    window.localStorage.setItem('std_roi_baseline_pct', '12');
    mockState.funnel = [
      {
        impressions: 10,
        engagement: 4,
        intent: 6,
        conversions: 5,
        prev_impressions: 8,
        prev_engagement: 3,
        prev_intent: 2,
        prev_conversions: 1,
        phone_reveals: 0,
        tour_requests: 5,
        directions: 0,
        comparisons: 0,
      },
    ];

    render(<LeadsView />);

    await waitFor(() => {
      expect(screen.getByText('$2,700')).toBeInTheDocument();
    });
    expect(screen.queryByText('Custom Baseline Applied')).not.toBeInTheDocument();
  });
});
