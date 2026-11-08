import { describe, expect, it } from 'vitest';
import { addressLine, buildCompareRows, cellText, NOT_LISTED, type CompareRecord } from '@/src/utils/comparisonModel';

const complete: CompareRecord = {
  id: 'a1b2c3d4-0000-4000-8000-000000000001',
  name: 'Sample Care Home',
  address_line1: '100 Main St',
  city: 'Minneapolis',
  state: 'MN',
  postal_code: '55401',
  phone: '612-555-0101',
  website_url: 'https://example.test',
  careTypes: ['Assisted Living', 'Memory Care'],
  licenseNumber: 'LIC-123',
  bedCapacity: 42,
};

const sparse: CompareRecord = {
  id: 'a1b2c3d4-0000-4000-8000-000000000002',
  name: 'Sparse Home',
  address_line1: null,
  city: 'Elk River',
  state: 'MN',
  postal_code: null,
  phone: '   ',
  website_url: null,
  careTypes: [],
  licenseNumber: null,
  bedCapacity: null,
};

const rowFor = (records: CompareRecord[], key: string) => buildCompareRows(records).find((r) => r.key === key)!;

describe('comparison rows: show what is recorded, never invent the rest', () => {
  it('shows complete values for a complete record', () => {
    expect(rowFor([complete], 'address').cells).toEqual(['100 Main St, Minneapolis, MN 55401']);
    expect(rowFor([complete], 'phone').cells).toEqual(['612-555-0101']);
    expect(rowFor([complete], 'care').cells).toEqual(['Assisted Living, Memory Care']);
    expect(rowFor([complete], 'license').cells).toEqual(['LIC-123']);
    expect(rowFor([complete], 'beds').cells).toEqual(['42']);
  });

  it('gives null, shown as "Not listed", for every missing or blank value', () => {
    expect(rowFor([sparse], 'address').cells).toEqual(['Elk River, MN']);
    expect(rowFor([sparse], 'phone').cells).toEqual([null]);
    expect(rowFor([sparse], 'website').cells).toEqual([null]);
    expect(rowFor([sparse], 'care').cells).toEqual([null]);
    expect(rowFor([sparse], 'license').cells).toEqual([null]);
    expect(rowFor([sparse], 'beds').cells).toEqual([null]);
    expect(cellText(null)).toBe(NOT_LISTED);
  });

  it('keeps one cell per facility, in the order selected, so columns line up', () => {
    const rows = buildCompareRows([complete, sparse]);
    for (const row of rows) expect(row.cells).toHaveLength(2);
    expect(rowFor([complete, sparse], 'phone').cells).toEqual(['612-555-0101', null]);
  });

  it('never shows a price, because no verified pricing source exists', () => {
    expect(rowFor([complete, sparse], 'pricing').cells).toEqual([null, null]);
  });

  it('treats a zero or negative bed count as not listed', () => {
    expect(rowFor([{ ...complete, bedCapacity: 0 }], 'beds').cells).toEqual([null]);
    expect(rowFor([{ ...complete, bedCapacity: -3 }], 'beds').cells).toEqual([null]);
  });

  it('builds the address without inventing any part of it', () => {
    expect(addressLine({ ...complete, address_line1: null })).toBe('Minneapolis, MN 55401');
    expect(addressLine({ ...complete, city: null, state: null, postal_code: null, address_line1: null })).toBeNull();
  });

  it('marks only the website row as a link', () => {
    expect(buildCompareRows([complete]).filter((r) => r.isLink).map((r) => r.key)).toEqual(['website']);
  });
});
