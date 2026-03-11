export const SCHEMA_VERSION = 'facility_record_v1';
export const PIPELINE_POLICY_VERSION = 'pipeline_quality_policy_v1_2_1';
export const INTEGRITY_RULESET_VERSION = 'data_integrity_tiers_v1_1';

export type CheckStatus = 'pass' | 'fail' | 'promote';
export type CheckSeverity = 'soft' | 'hard' | 'promote';

export type CheckResult = {
  check_id: string;
  status: CheckStatus;
  severity: CheckSeverity;
  metric_value: number | null;
  threshold: number | null;
  baseline_reference_version: string | null;
};

export const LICENSE_STATUS_ENUM = ['active', 'inactive', 'probational', 'pending', 'unknown'] as const;
export type LicenseStatus = (typeof LICENSE_STATUS_ENUM)[number];

export const MATCH_METHOD_ENUM = [
  'exact_id',
  'exact_name_zip',
  'exact_name_city',
  'fuzzy_name_zip',
  'fuzzy_name_city',
  'manual_override',
  'state_direct_match',
  'unmatched',
] as const;
export type MatchMethod = (typeof MATCH_METHOD_ENUM)[number];

export const GATE_CHECKS = {
  G1_1: { id: 'G1.1', severity: 'hard' as const },
  G1_2: { id: 'G1.2', severity: 'hard' as const },
  G1_3: { id: 'G1.3', severity: 'hard' as const },
  G1_4: { id: 'G1.4', severity: 'hard' as const },
  G1_5: { id: 'G1.5', severity: 'hard' as const },
  G1_6: { id: 'G1.6', severity: 'hard' as const },
  G2_1: { id: 'G2.1', severity: 'hard' as const },
  G2_2: { id: 'G2.2', severity: 'hard' as const },
  G2_3: { id: 'G2.3', severity: 'hard' as const },
  G3_1: { id: 'G3.1', severity: 'hard' as const },
  G3_2: { id: 'G3.2', severity: 'hard' as const },
  G3_3: { id: 'G3.3', severity: 'hard' as const },
  G3_4: { id: 'G3.4', severity: 'promote' as const },
  G3_5: { id: 'G3.5', severity: 'promote' as const },
  G3_6: { id: 'G3.6', severity: 'promote' as const },
  G3_7: { id: 'G3.7', severity: 'promote' as const },
  G3_8: { id: 'G3.8', severity: 'hard' as const },
} as const;

export type CanonicalFacilityRecord = {
  facility_id: string;
  facility_name: string;
  legal_business_name: string | null;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  postal_code: string;
  county: string | null;
  lat: number | null;
  lng: number | null;
  cms_ccn: string | null;
  medicare_certified: boolean;
  medicaid_certified: boolean;
  state_license_number: string | null;
  license_id: string | null;
  license_type: string | null;
  issuing_agency: string;
  license_status_raw: string | null;
  license_status: LicenseStatus;
  license_issue_date: string | null;
  license_expiration_date: string | null;
  license_publicly_available: boolean;
  license_unavailable_reason: string | null;
  licensed_beds: number | null;
  certified_beds: number | null;
  administrator_name: string | null;
  ownership_type: string | null;
  chain_name: string | null;
  overall_rating: number | null;
  health_inspection_rating: number | null;
  staffing_rating: number | null;
  quality_measure_rating: number | null;
  last_verified_date: string;
  source_urls: string[] | null;
  match_method: MatchMethod;
  match_confidence: number | null;
  source_retrieved_at: string | null;
  data_version: string;
  schema_version: string;
};

export const REQUIRED_RECORD_KEYS: readonly (keyof CanonicalFacilityRecord)[] = [
  'facility_id',
  'facility_name',
  'legal_business_name',
  'address_line1',
  'address_line2',
  'city',
  'state',
  'postal_code',
  'county',
  'lat',
  'lng',
  'cms_ccn',
  'medicare_certified',
  'medicaid_certified',
  'state_license_number',
  'license_id',
  'license_type',
  'issuing_agency',
  'license_status_raw',
  'license_status',
  'license_issue_date',
  'license_expiration_date',
  'license_publicly_available',
  'license_unavailable_reason',
  'licensed_beds',
  'certified_beds',
  'administrator_name',
  'ownership_type',
  'chain_name',
  'overall_rating',
  'health_inspection_rating',
  'staffing_rating',
  'quality_measure_rating',
  'last_verified_date',
  'source_urls',
  'match_method',
  'match_confidence',
  'source_retrieved_at',
  'data_version',
  'schema_version',
] as const;

export type GateFailure = {
  check_id: string;
  severity: CheckSeverity;
  state: string;
  record_index: number;
  facility_id: string;
  field: string;
  reason: string;
};
