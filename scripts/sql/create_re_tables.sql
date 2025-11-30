-- Canonical data versioning
CREATE TABLE IF NOT EXISTS re_data_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date DATE NOT NULL,
  label TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Facilities canonical
CREATE TABLE IF NOT EXISTS re_facilities (
  id UUID PRIMARY KEY,
  external_id TEXT,
  name TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  postal_code TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  capacity INT,
  care_types TEXT[],
  owner TEXT,
  operator TEXT,
  license_number TEXT,
  license_status TEXT,
  data_version UUID NOT NULL REFERENCES re_data_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS re_facilities_version_idx ON re_facilities(data_version);

-- Pricing canonical
CREATE TABLE IF NOT EXISTS re_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES re_facilities(id) ON DELETE CASCADE,
  min_price INT,
  max_price INT,
  currency TEXT DEFAULT 'usd',
  observed_on DATE,
  data_version UUID NOT NULL REFERENCES re_data_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS re_pricing_version_idx ON re_pricing(data_version);

-- Inspections / regulatory canonical
CREATE TABLE IF NOT EXISTS re_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facility_id UUID NOT NULL REFERENCES re_facilities(id) ON DELETE CASCADE,
  inspected_on DATE,
  severity TEXT,
  findings TEXT[],
  source TEXT,
  url TEXT,
  data_version UUID NOT NULL REFERENCES re_data_versions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS re_inspections_version_idx ON re_inspections(data_version);

-- Data catalog for exported assets
CREATE TABLE IF NOT EXISTS data_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  data_version UUID NOT NULL REFERENCES re_data_versions(id) ON DELETE CASCADE,
  format TEXT NOT NULL,
  url TEXT NOT NULL,
  bytes BIGINT,
  row_count INT,
  checksum TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS data_catalog_version_idx ON data_catalog(data_version);

-- Digital products enhancements (payment links)
ALTER TABLE IF EXISTS digital_products
ADD COLUMN IF NOT EXISTS payment_link_url TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
