// @vitest-environment jsdom
import React from 'react';
import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DirectorySearch from '@/features/family/discovery/DirectorySearch';

const {
  rpcMock,
  fromMock,
  resolvePublicIdentitiesMock,
  loadFacilityIndexWithOptionsMock,
  getLocationSuggestionsMock,
  getLocationMock,
} = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
  resolvePublicIdentitiesMock: vi.fn(),
  loadFacilityIndexWithOptionsMock: vi.fn(),
  getLocationSuggestionsMock: vi.fn(),
  getLocationMock: vi.fn(),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    from: (...args: unknown[]) => fromMock(...args),
  },
}));

vi.mock('@/src/utils/facilityIndex', () => ({
  loadFacilityIndexWithOptions: (...args: unknown[]) => loadFacilityIndexWithOptionsMock(...args),
  resolvePublicIdentities: (...args: unknown[]) => resolvePublicIdentitiesMock(...args),
}));

vi.mock('@/src/lib/typesense', () => ({
  hasTypesense: false,
  typesenseClient: null,
}));

vi.mock('@/src/utils/locationSuggestions', () => ({
  getLocationSuggestions: (...args: unknown[]) => getLocationSuggestionsMock(...args),
}));

vi.mock('@/src/hooks/useGeolocation', () => ({
  useGeolocation: () => ({
    coordinates: null,
    nearestCity: '',
    getLocation: getLocationMock,
    loading: false,
    error: '',
  }),
}));

type FacilityRow = {
  id: string;
  name: string;
  city: string;
  state: string;
  address_line1: string;
  postal_code: string;
  phone?: string | null;
  website_url?: string | null;
  primary_care_type_slug?: string | null;
};

const claimFacilityId = '11111111-1111-4111-8111-111111111111';

const kirklandRows: FacilityRow[] = [
  {
    id: 'fac-1',
    name: 'The Gardens at Juanita Bay',
    city: 'Kirkland',
    state: 'WA',
    address_line1: '11849 97th Ln NE',
    postal_code: '98034',
    primary_care_type_slug: 'assisted-living',
  },
  {
    id: 'fac-2',
    name: 'Kirkland Heritage Manor',
    city: 'Kirkland',
    state: 'WA',
    address_line1: '400 15th Ave',
    postal_code: '98033',
    primary_care_type_slug: 'nursing-homes',
  },
];

const statewideRows: FacilityRow[] = [
  ...kirklandRows,
  {
    id: 'fac-3',
    name: 'Bellevue Heights Sanctuary',
    city: 'Bellevue',
    state: 'WA',
    address_line1: '2200 112th Ave NE',
    postal_code: '98004',
    primary_care_type_slug: 'independent-living',
  },
  {
    id: 'fac-4',
    name: 'Redmond Ridge Senior Living',
    city: 'Redmond',
    state: 'WA',
    address_line1: '16500 NE 76th St',
    postal_code: '98052',
    primary_care_type_slug: 'memory-care',
  },
];

const claimRows: FacilityRow[] = [
  {
    id: claimFacilityId,
    name: 'Kirkland Manor Claimable',
    city: 'Kirkland',
    state: 'WA',
    address_line1: '500 Market St',
    postal_code: '98033',
    primary_care_type_slug: 'assisted-living',
  },
];

const detailRowsById = {
  'fac-1': {
    id: 'fac-1',
    latitude: 47.706,
    longitude: -122.206,
    phone: '(425) 555-0129',
    website_url: 'https://juanitabaycare.com',
    state_license_number: '0094231-A',
    cms_certification_number: '532144',
    canonical_payload: {
      medicare_certified: true,
      medicaid_certified: true,
      ownership_type: 'nonprofit',
      certified_beds: 120,
    },
    facility_licensing: [{ license_number: '0094231-A', bed_capacity: 120 }],
    facility_care_types: [{ care_types: { name: 'Assisted Living', slug: 'assisted-living' } }],
  },
  'fac-2': {
    id: 'fac-2',
    latitude: 47.676,
    longitude: -122.2,
    phone: '(425) 555-0188',
    website_url: 'https://kirklandheritage.org',
    state_license_number: '008122-C',
    cms_certification_number: '612200',
    canonical_payload: {
      medicare_certified: true,
      medicaid_certified: false,
      ownership_type: 'for_profit',
      certified_beds: 85,
    },
    facility_licensing: [{ license_number: '008122-C', bed_capacity: 85 }],
    facility_care_types: [{ care_types: { name: 'Nursing Homes', slug: 'nursing-homes' } }],
  },
  'fac-3': {
    id: 'fac-3',
    latitude: 47.615,
    longitude: -122.201,
    phone: '(425) 555-0900',
    website_url: 'https://bellevueheights.com',
    state_license_number: '0044567-B',
    canonical_payload: {
      medicare_certified: false,
      medicaid_certified: false,
      ownership_type: 'nonprofit',
      certified_beds: 150,
    },
    facility_licensing: [{ license_number: '0044567-B', bed_capacity: 150 }],
    facility_care_types: [{ care_types: { name: 'Independent Living', slug: 'independent-living' } }],
  },
  'fac-4': {
    id: 'fac-4',
    latitude: 47.674,
    longitude: -122.121,
    phone: '(425) 555-0333',
    website_url: 'https://redmondridgecare.com',
    state_license_number: '0012290-R',
    canonical_payload: {
      medicare_certified: false,
      medicaid_certified: true,
      ownership_type: 'government',
      certified_beds: 92,
    },
    facility_licensing: [{ license_number: '0012290-R', bed_capacity: 92 }],
    facility_care_types: [{ care_types: { name: 'Memory Care', slug: 'memory-care' } }],
  },
  [claimFacilityId]: {
    id: claimFacilityId,
    latitude: 47.676,
    longitude: -122.207,
    phone: '(425) 555-7000',
    website_url: 'https://claimable-kirkland.example.com',
    state_license_number: 'CLM-98033',
    canonical_payload: {
      medicare_certified: false,
      medicaid_certified: false,
      ownership_type: 'for_profit',
      certified_beds: 40,
    },
    facility_licensing: [{ license_number: 'CLM-98033', bed_capacity: 40 }],
    facility_care_types: [{ care_types: { name: 'Assisted Living', slug: 'assisted-living' } }],
  },
} as const;

const publicIdentityById: Record<string, { public_slug: string; public_route_id: number; primary_care_type_slug: string }> = {
  'fac-1': {
    public_slug: 'the-gardens-at-juanita-bay',
    public_route_id: 101,
    primary_care_type_slug: 'assisted-living',
  },
  'fac-2': {
    public_slug: 'kirkland-heritage-manor',
    public_route_id: 102,
    primary_care_type_slug: 'nursing-homes',
  },
  'fac-3': {
    public_slug: 'bellevue-heights-sanctuary',
    public_route_id: 103,
    primary_care_type_slug: 'independent-living',
  },
  'fac-4': {
    public_slug: 'redmond-ridge-senior-living',
    public_route_id: 104,
    primary_care_type_slug: 'memory-care',
  },
};

const renderSearch = (entry: string) =>
  render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/search" element={<DirectorySearch />} />
        </Routes>
      </MemoryRouter>
    </HelmetProvider>,
  );

describe('DirectorySearch', () => {
  beforeEach(() => {
    getLocationSuggestionsMock.mockReturnValue([]);
    loadFacilityIndexWithOptionsMock.mockResolvedValue([]);
    resolvePublicIdentitiesMock.mockImplementation(async (rows: FacilityRow[]) =>
      rows.map((row) => ({
        ...row,
        ...(publicIdentityById[row.id] || {}),
      })),
    );
    fromMock.mockImplementation((table: string) => {
      if (table !== 'facilities') {
        throw new Error(`Unexpected table: ${table}`);
      }

      return {
        select: () => ({
          in: async (_column: string, ids: string[]) => ({
            data: ids
              .map((id) => detailRowsById[id as keyof typeof detailRowsById])
              .filter(Boolean),
            error: null,
          }),
        }),
      };
    });
    rpcMock.mockImplementation(async (fn: string, params: Record<string, unknown>) => {
      if (fn !== 'search_facilities') {
        throw new Error(`Unexpected RPC: ${fn}`);
      }

      if (params.postal_filter === '98033') {
        return { data: claimRows, error: null };
      }

      if (params.state_filter === 'WA' && params.city_filter) {
        return { data: kirklandRows, error: null };
      }

      if (params.state_filter === 'WA') {
        return { data: statewideRows, error: null };
      }

      return { data: [], error: null };
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('renders consumer city results with trust fields and nearby city sections', async () => {
    renderSearch('/search?state=washington&location=Kirkland,%20WA');

    expect(
      await screen.findByRole('heading', { name: 'Senior Living Communities in Kirkland, WA' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'The Gardens at Juanita Bay' })).toHaveAttribute(
      'href',
      '/assisted-living/washington/kirkland/the-gardens-at-juanita-bay-101/',
    );
    expect(screen.getByText(/Browse 2 communities in Kirkland, WA\./i)).toBeInTheDocument();
    expect(screen.getAllByText('Licensed').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Medicare').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Medicaid').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Official Website Verified').length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Claim Listing' })).not.toBeInTheDocument();
    expect(screen.getByText('Expand your search nearby')).toBeInTheDocument();
    expect(screen.getByText('Nearby options in Bellevue')).toBeInTheDocument();
    expect(screen.getByText('Nearby options in Redmond')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /View (Facility|Community)/i }).length).toBeGreaterThanOrEqual(4);
  }, 15000);

  it('auto-searches direct state query entries', async () => {
    renderSearch('/search?state=washington');

    expect(
      await screen.findByRole('heading', { name: 'Senior Living Communities in Washington' }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('link', { name: 'Bellevue Heights Sanctuary' })).toBeInTheDocument();
    expect(screen.getByText(/Browse 4 communities in Washington\./i)).toBeInTheDocument();
    expect(screen.queryByText('Expand your search nearby')).not.toBeInTheDocument();
    expect(rpcMock).toHaveBeenCalledWith(
      'search_facilities',
      expect.objectContaining({
        state_filter: 'WA',
        city_filter: null,
        postal_filter: null,
      }),
    );
  });

  it('keeps claim-mode ZIP search routed to claim listing actions', async () => {
    renderSearch('/search?claim=1&location=98033');

    expect(await screen.findByRole('heading', { name: 'Find Your Facility By ZIP' })).toBeInTheDocument();
    const claimLink = await screen.findByRole('link', { name: 'Claim Listing' });
    expect(claimLink).toHaveAttribute('href', `/claim/${claimFacilityId}`);
    expect(screen.queryByRole('link', { name: /View (Facility|Community)/i })).not.toBeInTheDocument();
  });
});
