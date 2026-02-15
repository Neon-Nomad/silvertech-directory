// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { OperatorQA } from '@/features/operator/dashboard/OperatorQA';

const mockUser = { id: 'u-1' };
const mockPlan = { plan: 'free', isPremium: false, loading: false };

vi.mock('@/src/context/AuthProvider', () => ({
  useAuth: () => ({ user: mockUser }),
}));

vi.mock('@/src/hooks/useOperatorPlan', () => ({
  useOperatorPlan: () => mockPlan,
}));

vi.mock('@/src/config/featureFlags', () => ({
  FEATURE_FLAGS: {
    qa_shadow_dashboard: true,
    qa_answer_premium_gate: true,
    qa_free_tier_limited_clarification: false,
  },
}));

vi.mock('@/src/utils/qaGuards', () => ({
  sanitizeInput: (text: string) => ({
    blocked: false,
    message: '',
    sanitizedText: text,
  }),
}));

vi.mock('@/src/utils/analytics', () => ({
  trackEvent: vi.fn(),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => {
      if (table === 'facilities') {
        return {
          select: () => ({
            eq: () => ({
              order: async () => ({
                data: [{ id: 'f-1', name: 'Golden Oaks' }],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'facility_questions') {
        return {
          select: () => ({
            in: () => ({
              order: async () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'facility_answers') {
        return {
          select: () => ({
            in: () => ({
              order: async () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'facility_faqs') {
        return {
          select: () => ({
            in: () => ({
              order: async () => ({
                data: [],
                error: null,
              }),
            }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
    rpc: vi.fn(async () => ({ data: null, error: null })),
  },
}));

describe('OperatorQA Phase 4 cleanup', () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders Official Responses flow and keeps community discussion deferred in V1', async () => {
    render(<OperatorQA />);

    await waitFor(() => {
      expect(screen.queryByText('Loading Q&A...')).not.toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Official Responses')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/Community discussion and moderation are deferred to V1\.5/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: /Community Discussion/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Community Discussion/i })).not.toBeInTheDocument();
  });
});
