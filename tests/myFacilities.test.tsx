// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MyFacilities } from '@/features/operator/dashboard/MyFacilities';

const navigateMock = vi.fn();

const facilitiesFixture = [
  {
    id: 'fac-1',
    owner_id: 'user-1',
    assigned_plan_owner_id: 'user-1',
    name: 'Golden Oaks',
    city: 'Austin',
    state: 'TX',
    description: 'A'.repeat(80),
    phone: '555',
    website: 'https://example.com',
    email: 'a@example.com',
    min_price: 1000,
    address_line1: '1 Main',
    updated_at: '2026-02-15T12:00:00.000Z',
  },
  {
    id: 'fac-2',
    owner_id: 'user-1',
    assigned_plan_owner_id: null,
    name: 'Harbor View',
    city: 'Dallas',
    state: 'TX',
    description: 'Short',
    phone: null,
    website: null,
    email: null,
    min_price: null,
    address_line1: null,
    updated_at: '2026-02-14T12:00:00.000Z',
  },
];

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [new URLSearchParams(''), vi.fn()],
  };
});

vi.mock('@/src/context/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' } }),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: (table: string) => ({
      select: () => {
        if (table === 'facilities') {
          return {
            eq: async () => ({ data: facilitiesFixture, error: null }),
          };
        }
        if (table === 'facility_claims') {
          return {
            eq: () => ({
              eq: async () => ({ count: 0, error: null }),
            }),
          };
        }
        return {
          eq: async () => ({ data: [], error: null }),
        };
      },
    }),
  },
}));

describe('MyFacilities', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('renders facilities and listing summary count', async () => {
    render(<MyFacilities />);

    await screen.findByText('Golden Oaks');
    expect(screen.getByText('Harbor View')).toBeInTheDocument();
    expect(screen.getByText('Showing 2 of 2 facilities')).toBeInTheDocument();
  });

  it('filters facilities by search query', async () => {
    render(<MyFacilities />);
    await screen.findByText('Golden Oaks');

    fireEvent.change(screen.getAllByPlaceholderText('Search facilities by name or location...')[0], {
      target: { value: 'Dallas' },
    });

    await waitFor(() => {
      expect(screen.queryByText('Golden Oaks')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Harbor View')).toBeInTheDocument();
  });

  it('navigates to help from support actions', async () => {
    render(<MyFacilities />);
    await screen.findByText('Golden Oaks');

    fireEvent.click(screen.getByRole('button', { name: 'Documentation' }));
    expect(navigateMock).toHaveBeenCalledWith('/dashboard/help');
  });

  it('routes claim CTA to ZIP-focused claim search', async () => {
    render(<MyFacilities />);
    await screen.findByText('Golden Oaks');

    fireEvent.click(screen.getByRole('button', { name: /find facility to claim/i }));
    expect(navigateMock).toHaveBeenCalledWith('/search?claim=1');
  });
});
