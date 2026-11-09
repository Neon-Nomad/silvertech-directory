// @vitest-environment jsdom
import React from 'react';
import * as jestDomMatchers from '@testing-library/jest-dom/matchers';
import { expect as vitestExpect } from 'vitest';
vitestExpect.extend(jestDomMatchers);
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter } from 'react-router-dom';
import ComparePage from '@/features/family/discovery/ComparePage';
import { ComparisonProvider } from '@/src/context/ComparisonContext';

const facilityRows = [
  {
    id: 'facility-a',
    name: 'Alpha Care',
    address_line1: '1 Main St',
    city: 'Minneapolis',
    state: 'MN',
    postal_code: '55401',
    phone: '612-555-0100',
    website_url: null,
    public_slug: 'alpha-care',
    public_route_id: 101,
    primary_care_type_slug: 'assisted-living',
    state_license_number: null,
    cms_certification_number: null,
    facility_licensing: [],
    facility_care_types: [],
  },
  {
    id: 'facility-b',
    name: 'Beta Home',
    address_line1: '2 Oak Ave',
    city: 'Duluth',
    state: 'MN',
    postal_code: '55802',
    phone: null,
    website_url: null,
    public_slug: 'beta-home',
    public_route_id: 102,
    primary_care_type_slug: 'memory-care',
    state_license_number: null,
    cms_certification_number: null,
    facility_licensing: [],
    facility_care_types: [],
  },
];

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: () => ({
      select: () => ({
        in: async () => ({ data: facilityRows, error: null }),
      }),
    }),
  },
}));

const renderComparePage = () =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={['/compare']}>
        <ComparisonProvider>
          <ComparePage />
        </ComparisonProvider>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('ComparePage accessibility', () => {
  beforeEach(() => {
    localStorage.setItem(
      'comparison_facilities',
      JSON.stringify([
        { id: 'facility-a', name: 'Alpha Care', city: 'Minneapolis', state: 'MN' },
        { id: 'facility-b', name: 'Beta Home', city: 'Duluth', state: 'MN' },
      ]),
    );
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('names the comparison table so screen readers announce what it is', async () => {
    renderComparePage();

    expect(await screen.findByRole('table', { name: 'Facilities compared side by side' })).toBeInTheDocument();
  });

  it('labels each remove button with the facility it removes', async () => {
    renderComparePage();

    expect(await screen.findByRole('button', { name: 'Remove Alpha Care from comparison' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove Beta Home from comparison' })).toBeInTheDocument();
  });

  it('does not add a second main landmark, since the app shell already provides one', async () => {
    const { container } = renderComparePage();

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(container.querySelector('main')).toBeNull();
  });
});
