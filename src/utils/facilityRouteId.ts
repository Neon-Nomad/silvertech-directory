type FacilityRouteSeed = {
  id?: string | null;
  name?: string | null;
  city?: string | null;
  state?: string | null;
  address_line1?: string | null;
  postal_code?: string | null;
  phone?: string | null;
  state_license_number?: string | null;
  facility_licensing?: Array<{
    license_number?: string | null;
  }> | null;
};

const toSlug = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const toCleanString = (value: unknown): string => {
  if (typeof value !== 'string') return '';
  return value.trim();
};

const hashString = (value: string): string => {
  let hash = 5381;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 33) ^ value.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
};

export const buildFacilityRouteId = (facility: FacilityRouteSeed): string | null => {
  const facilityId = toCleanString(facility.id);
  if (!facilityId) return null;

  const licenseNumber =
    toCleanString(facility.facility_licensing?.[0]?.license_number) ||
    toCleanString(facility.state_license_number);
  const name = toCleanString(facility.name);
  const city = toCleanString(facility.city);
  const state = toCleanString(facility.state);
  const addressLine1 = toCleanString(facility.address_line1);
  const postalCode = toCleanString(facility.postal_code);
  const phone = toCleanString(facility.phone);

  const keyParts = [name, city, state, licenseNumber, phone, addressLine1, postalCode, facilityId];
  const key = keyParts.filter(Boolean).join('|');
  const baseParts = [name, city, state, licenseNumber || postalCode || phone || ''];
  const base = toSlug(baseParts.filter(Boolean).join(' '));
  const hash = hashString(key || facilityId);

  return base ? `${base}-${hash}` : `facility-${hash}`;
};
