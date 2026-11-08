// Builds the side-by-side comparison rows. Pure: no network, no React.
//
// Rule: a value is shown only when it is present in the facility's record. Anything missing is null, and the
// page shows "Not listed" for it. Nothing here estimates, defaults, or infers a price, rating, or amenity.

export const NOT_LISTED = 'Not listed';

export type CompareRecord = {
  id: string;
  name: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  website_url: string | null;
  careTypes: string[];
  licenseNumber: string | null;
  bedCapacity: number | null;
};

export type CompareRow = {
  key: string;
  label: string;
  cells: Array<string | null>;
  isLink?: boolean;
};

const clean = (value: string | null | undefined): string | null => {
  const trimmed = (value ?? '').trim();
  return trimmed ? trimmed : null;
};

export const addressLine = (record: CompareRecord): string | null => {
  const locality = [clean(record.city), clean(record.state)].filter(Boolean).join(', ');
  const localityWithPostal = [locality, clean(record.postal_code)].filter(Boolean).join(' ');
  const parts = [clean(record.address_line1), localityWithPostal].filter(Boolean);
  return parts.length ? parts.join(', ') : null;
};

export const buildCompareRows = (records: CompareRecord[]): CompareRow[] => [
  { key: 'address', label: 'Address', cells: records.map(addressLine) },
  { key: 'phone', label: 'Phone', cells: records.map((r) => clean(r.phone)) },
  { key: 'website', label: 'Website', cells: records.map((r) => clean(r.website_url)), isLink: true },
  {
    key: 'care',
    label: 'Care types',
    cells: records.map((r) => (r.careTypes.length ? r.careTypes.join(', ') : null)),
  },
  { key: 'license', label: 'License number', cells: records.map((r) => clean(r.licenseNumber)) },
  {
    key: 'beds',
    label: 'Licensed beds',
    cells: records.map((r) => (r.bedCapacity != null && r.bedCapacity > 0 ? String(r.bedCapacity) : null)),
  },
  // No verified pricing source exists in the directory data, so pricing is never shown as a value.
  { key: 'pricing', label: 'Pricing', cells: records.map(() => null) },
];

// Shows the cell text, or "Not listed" when the record has no value for it.
export const cellText = (value: string | null): string => value ?? NOT_LISTED;
