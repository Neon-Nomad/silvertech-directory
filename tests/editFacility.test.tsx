// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EditFacility } from '@/features/operator/dashboard/EditFacility';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ id: 'fac-1' }),
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/src/context/AuthProvider', () => ({
  useAuth: () => ({ user: { id: 'user-1' }, loading: false }),
}));

vi.mock('@/features/operator/dashboard/FacilityPhotoManager', () => ({
  FacilityPhotoManager: () => <div data-testid="photo-manager">Photo Manager</div>,
}));

vi.mock('@/features/operator/dashboard/FacilityAmenitiesEditor', () => ({
  FacilityAmenitiesEditor: () => <div data-testid="amenities-editor">Amenities Editor</div>,
}));

vi.mock('@/features/operator/dashboard/FacilityCareTypesEditor', () => ({
  FacilityCareTypesEditor: () => <div data-testid="care-types-editor">Care Types Editor</div>,
}));

vi.mock('@/features/operator/dashboard/ProfileCompleteness', () => ({
  ProfileCompleteness: () => <div data-testid="profile-completeness">Profile Completeness</div>,
  getProfileCompleteness: () => ({ criteria: [], metCount: 0, totalCount: 10, percentage: 0 }),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    rpc: async () => ({ data: null, error: { message: 'rpc missing in test' } }),
    from: (table: string) => {
      if (table === 'facilities') {
        return {
          select: () => ({
            eq: () => ({
              single: async () => ({
                data: {
                  id: 'fac-1',
                  owner_id: 'user-1',
                  name: 'Golden Oaks',
                  description: 'Desc',
                  phone: '(555) 123-4567',
                  website: 'https://example.com',
                  email: 'facility@example.com',
                  address_line1: '1 Main St',
                  city: 'Austin',
                  state: 'TX',
                  postal_code: '78701',
                  min_price: 3500,
                  max_price: 6800,
                  plan: 'basic',
                },
                error: null,
              }),
            }),
          }),
        };
      }

      if (table === 'facility_photos' || table === 'facility_amenities' || table === 'facility_care_types') {
        return {
          select: () => ({
            eq: async () => ({ count: 1, error: null }),
          }),
        };
      }

      throw new Error(`Unexpected table: ${table}`);
    },
  },
}));

describe('EditFacility Phase 5 versioning workflow', () => {
  beforeEach(() => {
    navigateMock.mockClear();
  });

  it('shows Save Draft and Publish Live actions', async () => {
    render(<EditFacility />);

    await waitFor(() => {
      expect(screen.getAllByText('Save Draft').length).toBeGreaterThan(0);
    });
    expect(screen.getAllByText('Publish Live').length).toBeGreaterThan(0);
  });

  it('uses decimal-friendly mobile keypad settings for pricing inputs', async () => {
    render(<EditFacility />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Minimum Monthly Cost').length).toBeGreaterThan(1);
      expect(screen.getAllByLabelText('Maximum Monthly Cost').length).toBeGreaterThan(1);
    });
    for (const min of screen.getAllByLabelText('Minimum Monthly Cost')) {
      expect(min).toHaveAttribute('inputmode', 'decimal');
    }
    for (const max of screen.getAllByLabelText('Maximum Monthly Cost')) {
      expect(max).toHaveAttribute('inputmode', 'decimal');
    }
  });

  it('keeps core contact and location sections available in mobile layout', async () => {
    render(<EditFacility />);

    await waitFor(() => {
      expect(screen.getAllByText('Basic Information').length).toBeGreaterThan(0);
    });

    expect(screen.getAllByLabelText('Phone Number').length).toBeGreaterThan(1);
    expect(screen.getAllByLabelText('Email Address').length).toBeGreaterThan(1);
    expect(screen.getAllByLabelText('Website URL').length).toBeGreaterThan(1);
    expect(screen.getAllByText('Location').length).toBeGreaterThan(0);
  });
});
