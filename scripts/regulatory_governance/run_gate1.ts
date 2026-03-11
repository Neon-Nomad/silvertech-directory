import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import {
  GATE_CHECKS,
  INTEGRITY_RULESET_VERSION,
  LICENSE_STATUS_ENUM,
  MATCH_METHOD_ENUM,
  PIPELINE_POLICY_VERSION,
  REQUIRED_RECORD_KEYS,
  SCHEMA_VERSION,
  type CanonicalFacilityRecord,
  type CheckResult,
  type GateFailure,
  type LicenseStatus,
  type MatchMethod,
} from './contracts.ts';

type RawRecord = Record<string, unknown>;

type CliOptions = {
  inputFiles: string[];
  outputRoot: string;
  dataVersion: string;
  baselineReferenceVersion: string | null;
};

type StateRunResult = {
  state: string;
  inputFile: string;
  totalRecords: number;
  failureCount: number;
  approvedForPublish: boolean;
};

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_MAP: Array<{ pattern: RegExp; status: LicenseStatus }> = [
  { pattern: /active|licensed|regular/i, status: 'active' },
  { pattern: /inactive|revoked|closed|expired|terminated|suspended/i, status: 'inactive' },
  { pattern: /probation|conditional|probational/i, status: 'probational' },
  { pattern: /pending|review/i, status: 'pending' },
];

const DETERMINISTIC_METHODS = new Set<MatchMethod>([
  'exact_id',
  'exact_name_zip',
  'exact_name_city',
  'state_direct_match',
]);

const DAY_MS = 24 * 60 * 60 * 1000;

const asObject = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {};

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const asNumber = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
};

const asInteger = (value: unknown): number | null => {
  const numeric = asNumber(value);
  if (numeric === null) return null;
  return Number.isInteger(numeric) ? numeric : Math.trunc(numeric);
};

const normalizeText = (value: string | null): string =>
  (value || '').trim().toLowerCase().replace(/\s+/g, ' ');

const toIsoDate = (value: unknown): string | null => {
  const raw = asString(value);
  if (!raw) return null;
  if (ISO_DATE_RE.test(raw)) return raw;

  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const month = Number(usMatch[1]);
    const day = Number(usMatch[2]);
    const year = Number(usMatch[3]);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
};

const normalizeStatus = (rawStatus: string | null): LicenseStatus => {
  if (!rawStatus) return 'unknown';
  for (const entry of STATUS_MAP) {
    if (entry.pattern.test(rawStatus)) return entry.status;
  }
  return 'unknown';
};

const normalizeMatchMethod = (rawMethod: string | null): { method: MatchMethod; recognized: boolean } => {
  if (!rawMethod) return { method: 'unmatched', recognized: true };
  const value = rawMethod.trim().toLowerCase();

  if (value === 'unmatched') return { method: 'unmatched', recognized: true };
  if (value.includes('manual')) return { method: 'manual_override', recognized: true };

  if (
    value.includes('ccn_direct') ||
    value.includes('name_ccn') ||
    value.includes('exact_id') ||
    value.includes('license_id')
  ) {
    return { method: 'exact_id', recognized: true };
  }

  if (value.includes('name_city_exact') || value.includes('exact_name_city')) {
    return { method: 'exact_name_city', recognized: true };
  }

  if (value === 'exact_name' || value === 'name_exact') {
    return { method: 'state_direct_match', recognized: true };
  }

  if (
    value.includes('zip') ||
    value.includes('exact_name_zip') ||
    value.includes('cms_exact_name_zip') ||
    value.includes('name_zip')
  ) {
    return { method: 'exact_name_zip', recognized: true };
  }

  if (value.includes('phone') || value.includes('statewide') || value.includes('direct')) {
    return { method: 'state_direct_match', recognized: true };
  }

  if (value.includes('fuzzy_city')) return { method: 'fuzzy_name_city', recognized: true };
  if (value.includes('fuzzy')) return { method: 'fuzzy_name_zip', recognized: true };

  return { method: 'unmatched', recognized: false };
};

const inferMatchConfidence = (rawMethod: string | null, normalizedMethod: MatchMethod): number | null => {
  if (DETERMINISTIC_METHODS.has(normalizedMethod)) return 1;
  if (!rawMethod) return null;

  const paren = rawMethod.match(/\((\d(?:\.\d+)?)\)/);
  if (paren) return Number(paren[1]);

  const suffix = rawMethod.match(/_(\d(?:\.\d+)?)$/);
  if (suffix) return Number(suffix[1]);

  if (rawMethod.toLowerCase().includes('fuzzy_1.00')) return 1;
  return normalizedMethod === 'unmatched' ? null : 0.9;
};

const sanitizeStateCode = (value: string | null): string | null => {
  if (!value) return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
};

const extractSourceUrls = (source: Record<string, unknown>): string[] | null => {
  const urls: string[] = [];
  for (const [key, value] of Object.entries(source)) {
    if (!/url|link|source/i.test(key)) continue;
    if (typeof value === 'string' && /^https?:\/\//i.test(value.trim())) {
      urls.push(value.trim());
    }
  }
  return urls.length > 0 ? Array.from(new Set(urls)) : null;
};

const inferLicenseAvailability = (licenseNumber: string | null, note: string | null): boolean => {
  if (note && /(does not publish|not publish|not publicly available|foia)/i.test(note)) return false;
  if (licenseNumber) return true;
  return true;
};

const computeFacilityId = (state: string, cmsCcn: string | null, name: string, postalCode: string): string => {
  const basis = cmsCcn
    ? `${state}|${cmsCcn}`
    : `${state}|${normalizeText(name)}|${normalizeText(postalCode)}`;
  const digest = crypto.createHash('sha256').update(basis).digest('hex');
  return `fac_${digest.slice(0, 20)}`;
};

const parseIsoTimestamp = (value: string): Date => {
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) return parsed;
  return new Date();
};

const parseCli = async (): Promise<CliOptions> => {
  const args = process.argv.slice(2);
  const options: CliOptions = {
    inputFiles: [],
    outputRoot: path.resolve(process.cwd(), 'artifacts', 'regulatory-governance'),
    dataVersion: `${new Date().toISOString().slice(0, 10)}.v1`,
    baselineReferenceVersion: null,
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--file' && args[i + 1]) {
      options.inputFiles.push(path.resolve(process.cwd(), args[i + 1]));
      i += 1;
      continue;
    }
    if (arg === '--output-root' && args[i + 1]) {
      options.outputRoot = path.resolve(process.cwd(), args[i + 1]);
      i += 1;
      continue;
    }
    if (arg === '--data-version' && args[i + 1]) {
      options.dataVersion = args[i + 1];
      i += 1;
      continue;
    }
    if (arg === '--baseline-reference-version' && args[i + 1]) {
      options.baselineReferenceVersion = args[i + 1];
      i += 1;
      continue;
    }
  }

  if (options.inputFiles.length === 0) {
    const entries = await fs.readdir(process.cwd(), { withFileTypes: true });
    options.inputFiles = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith('_nursing_homes_with_licenses.json') &&
          entry.name !== 'all_states_nursing_homes_with_licenses.json'
      )
      .map((entry) => path.resolve(process.cwd(), entry.name))
      .sort();
  }

  return options;
};

const mapRawToCanonical = (
  raw: RawRecord,
  index: number,
  stateFallback: string,
  dataVersion: string,
  sourceRetrievedAt: string
): {
  record: CanonicalFacilityRecord;
  issues: GateFailure[];
} => {
  const address = asObject(raw.address);
  const details = asObject(raw.facility_details);
  const ratings = asObject(raw.ratings);
  const dataSource = asObject(raw.data_source);
  const location = asObject(raw.location);
  const stateLicense = asObject((raw.state_license as unknown) ?? (raw.regulatory as unknown));

  const facilityName = asString(raw.name) || `unknown_${index}`;
  const state = sanitizeStateCode(asString(address.state)) || stateFallback;
  const postalCode = asString(address.zip_code) || asString(address.zip) || '';

  const rawLicenseStatus =
    asString(stateLicense.license_status) ||
    asString(stateLicense.status) ||
    asString(stateLicense.operation_status);
  const normalizedStatus = normalizeStatus(rawLicenseStatus);

  const rawMatchMethod = asString(stateLicense.match_method);
  const normalizedMatch = normalizeMatchMethod(rawMatchMethod);
  const matchConfidence = inferMatchConfidence(rawMatchMethod, normalizedMatch.method);

  const licenseNumber =
    asString(stateLicense.state_license_number) ||
    asString(stateLicense.license_number) ||
    asString(stateLicense.license_id);
  const licenseNote = asString(stateLicense.license_note) || asString(stateLicense.state_license_note);
  const licensePubliclyAvailable = inferLicenseAvailability(licenseNumber, licenseNote);

  const cmsCcn =
    asString(stateLicense.cms_certification_number) ||
    asString(stateLicense.medicare_ccn) ||
    asString(stateLicense.federal_provider_number);

  const providerType = asString(details.provider_type) || '';
  const medicareCertified = /medicare/i.test(providerType);
  const medicaidCertified = /medicaid/i.test(providerType);

  const canonical: CanonicalFacilityRecord = {
    facility_id: computeFacilityId(state, cmsCcn, facilityName, postalCode),
    facility_name: facilityName,
    legal_business_name: asString(details.legal_business_name),
    address_line1: asString(address.street) || '',
    address_line2: asString(address.address_line2),
    city: asString(address.city) || '',
    state,
    postal_code: postalCode,
    county: asString(location.county),
    lat: asNumber(location.latitude),
    lng: asNumber(location.longitude),
    cms_ccn: cmsCcn,
    medicare_certified: medicareCertified,
    medicaid_certified: medicaidCertified,
    state_license_number: licenseNumber,
    license_id: asString(stateLicense.license_id),
    license_type: asString(stateLicense.license_type),
    issuing_agency: asString(stateLicense.issuing_agency) || 'Unknown',
    license_status_raw: rawLicenseStatus,
    license_status: normalizedStatus,
    license_issue_date:
      toIsoDate(stateLicense.license_issue_date) ||
      toIsoDate(stateLicense.license_issued_date) ||
      toIsoDate(stateLicense.license_effective_date) ||
      toIsoDate(stateLicense.initial_license_date),
    license_expiration_date: toIsoDate(stateLicense.license_expiration_date),
    license_publicly_available: licensePubliclyAvailable,
    license_unavailable_reason: licensePubliclyAvailable ? null : licenseNote || 'Not publicly available',
    licensed_beds: asInteger(stateLicense.licensed_beds),
    certified_beds: asInteger(details.certified_beds),
    administrator_name: asString(stateLicense.administrator),
    ownership_type: asString(details.ownership_type),
    chain_name: asString(details.chain_name),
    overall_rating: asInteger(ratings.overall_rating),
    health_inspection_rating: asInteger(ratings.health_inspection_rating),
    staffing_rating: asInteger(ratings.staffing_rating),
    quality_measure_rating: asInteger(ratings.quality_measure_rating),
    last_verified_date: toIsoDate(stateLicense.last_verified_date) || '',
    source_urls: extractSourceUrls(dataSource),
    match_method: normalizedMatch.method,
    match_confidence: matchConfidence,
    source_retrieved_at: sourceRetrievedAt,
    data_version: dataVersion,
    schema_version: SCHEMA_VERSION,
  };

  const issues: GateFailure[] = [];
  if (!normalizedMatch.recognized && rawMatchMethod) {
    issues.push({
      check_id: GATE_CHECKS.G1_3.id,
      severity: GATE_CHECKS.G1_3.severity,
      state,
      record_index: index,
      facility_id: canonical.facility_id,
      field: 'match_method',
      reason: `Unsupported match method value "${rawMatchMethod}"`,
    });
  }

  return { record: canonical, issues };
};

const validateRecord = (
  record: CanonicalFacilityRecord,
  index: number,
  state: string
): GateFailure[] => {
  const failures: GateFailure[] = [];
  const keys = Object.keys(record).sort();
  const expected = [...REQUIRED_RECORD_KEYS].sort();
  if (keys.length !== expected.length || keys.some((key, keyIndex) => key !== expected[keyIndex])) {
    failures.push({
      check_id: GATE_CHECKS.G1_1.id,
      severity: GATE_CHECKS.G1_1.severity,
      state,
      record_index: index,
      facility_id: record.facility_id,
      field: 'record',
      reason: 'Record keys do not match canonical contract (additional/missing keys detected)',
    });
  }

  for (const requiredKey of REQUIRED_RECORD_KEYS) {
    if (!(requiredKey in record)) {
      failures.push({
        check_id: GATE_CHECKS.G1_2.id,
        severity: GATE_CHECKS.G1_2.severity,
        state,
        record_index: index,
        facility_id: record.facility_id,
        field: requiredKey,
        reason: 'Missing required key',
      });
    }
  }

  if (!LICENSE_STATUS_ENUM.includes(record.license_status)) {
    failures.push({
      check_id: GATE_CHECKS.G1_3.id,
      severity: GATE_CHECKS.G1_3.severity,
      state,
      record_index: index,
      facility_id: record.facility_id,
      field: 'license_status',
      reason: `Invalid normalized status "${record.license_status}"`,
    });
  }

  if (!MATCH_METHOD_ENUM.includes(record.match_method)) {
    failures.push({
      check_id: GATE_CHECKS.G1_3.id,
      severity: GATE_CHECKS.G1_3.severity,
      state,
      record_index: index,
      facility_id: record.facility_id,
      field: 'match_method',
      reason: `Invalid controlled match method "${record.match_method}"`,
    });
  }

  if (
    record.license_publicly_available === false &&
    (record.state_license_number !== null ||
      !record.license_unavailable_reason ||
      record.license_unavailable_reason.trim().length === 0)
  ) {
    failures.push({
      check_id: GATE_CHECKS.G1_4.id,
      severity: GATE_CHECKS.G1_4.severity,
      state,
      record_index: index,
      facility_id: record.facility_id,
      field: 'license_publicly_available',
      reason: 'license_publicly_available=false requires null state_license_number and non-empty reason',
    });
  }

  if (record.license_publicly_available === true && record.license_unavailable_reason !== null) {
    failures.push({
      check_id: GATE_CHECKS.G1_4.id,
      severity: GATE_CHECKS.G1_4.severity,
      state,
      record_index: index,
      facility_id: record.facility_id,
      field: 'license_unavailable_reason',
      reason: 'license_unavailable_reason must be null when license_publicly_available=true',
    });
  }

  const dateFields: Array<keyof CanonicalFacilityRecord> = [
    'license_issue_date',
    'license_expiration_date',
    'last_verified_date',
  ];
  for (const dateField of dateFields) {
    const value = record[dateField];
    if (value !== null && (typeof value !== 'string' || !ISO_DATE_RE.test(value))) {
      failures.push({
        check_id: GATE_CHECKS.G1_5.id,
        severity: GATE_CHECKS.G1_5.severity,
        state,
        record_index: index,
        facility_id: record.facility_id,
        field: dateField,
        reason: 'Date field must be YYYY-MM-DD or null',
      });
    }
  }

  const hasLat = record.lat !== null;
  const hasLng = record.lng !== null;
  if (hasLat !== hasLng) {
    failures.push({
      check_id: GATE_CHECKS.G1_6.id,
      severity: GATE_CHECKS.G1_6.severity,
      state,
      record_index: index,
      facility_id: record.facility_id,
      field: 'lat/lng',
      reason: 'lat and lng must both be null or both be present',
    });
  }

  return failures;
};

const buildCheckResults = (
  failures: GateFailure[],
  baselineReferenceVersion: string | null
): CheckResult[] => {
  const byCheck = new Map<string, number>();
  for (const failure of failures) {
    byCheck.set(failure.check_id, (byCheck.get(failure.check_id) || 0) + 1);
  }

  return Object.values(GATE_CHECKS).map((check) => {
    const failed = byCheck.get(check.id) || 0;
    return {
      check_id: check.id,
      status: failed > 0 ? 'fail' : 'pass',
      severity: check.severity,
      metric_value: failed,
      threshold: 0,
      baseline_reference_version: baselineReferenceVersion,
    };
  });
};

const countDuplicates = (records: CanonicalFacilityRecord[]): number => {
  const signatures = new Map<string, number>();
  for (const record of records) {
    const signature = `${normalizeText(record.facility_name)}|${normalizeText(record.address_line1)}|${normalizeText(
      record.postal_code
    )}`;
    signatures.set(signature, (signatures.get(signature) || 0) + 1);
  }
  let duplicates = 0;
  for (const value of signatures.values()) {
    if (value > 1) duplicates += value;
  }
  return duplicates;
};

const safeRate = (numerator: number, denominator: number): number => {
  if (denominator === 0) return 0;
  return Number((numerator / denominator).toFixed(6));
};

const evaluateFreshnessStage = (records: CanonicalFacilityRecord[]): number => {
  if (records.length === 0) return 3;
  const newestVerified = records
    .map((record) => parseIsoTimestamp(record.last_verified_date).getTime())
    .filter((time) => Number.isFinite(time))
    .sort((a, b) => b - a)[0];
  if (!Number.isFinite(newestVerified)) return 3;
  const ageDays = Math.floor((Date.now() - newestVerified) / DAY_MS);
  if (ageDays > 120) return 3;
  if (ageDays > 90) return 2;
  if (ageDays > 60) return 1;
  return 0;
};

const writeJson = async (filePath: string, payload: unknown): Promise<void> => {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
};

const runForFile = async (
  filePath: string,
  runDir: string,
  options: CliOptions,
  nowIso: string
): Promise<StateRunResult> => {
  const rawText = await fs.readFile(filePath, 'utf8');
  const snapshotHash = crypto.createHash('sha256').update(rawText).digest('hex');
  const parsed = JSON.parse(rawText) as unknown;
  const recordsRaw = Array.isArray(parsed) ? parsed : [];

  const first = asObject(recordsRaw[0]);
  const firstAddress = asObject(first.address);
  const fallbackState =
    sanitizeStateCode(asString(firstAddress.state)) ||
    path.basename(filePath).slice(0, 2).toUpperCase().replace(/^DC$/, 'DC');
  const state = fallbackState;

  const stateDir = path.join(runDir, state);
  const inputManifest = {
    state,
    input_file: path.basename(filePath),
    source_urls: [],
    retrieval_timestamps: [nowIso],
    raw_record_count: recordsRaw.length,
    raw_source_hash: snapshotHash,
    content_type: 'application/json',
    schema_version: SCHEMA_VERSION,
    data_version: options.dataVersion,
    baseline_reference_version: options.baselineReferenceVersion,
    policy_version: PIPELINE_POLICY_VERSION,
  };

  const canonicalRecords: CanonicalFacilityRecord[] = [];
  const failures: GateFailure[] = [];
  for (let index = 0; index < recordsRaw.length; index += 1) {
    const rawRecord = asObject(recordsRaw[index]);
    const mapped = mapRawToCanonical(rawRecord, index, state, options.dataVersion, nowIso);
    canonicalRecords.push(mapped.record);
    failures.push(...mapped.issues);
    failures.push(...validateRecord(mapped.record, index, state));
  }

  const checkResults = buildCheckResults(failures, options.baselineReferenceVersion);
  const hardFailures = checkResults.filter((result) => result.severity === 'hard' && result.status === 'fail').length;
  const approvedForPublish = hardFailures === 0;

  const confidenceValues = canonicalRecords
    .map((record) => record.match_confidence)
    .filter((value): value is number => value !== null);
  const confidenceAverage =
    confidenceValues.length > 0
      ? Number((confidenceValues.reduce((sum, value) => sum + value, 0) / confidenceValues.length).toFixed(6))
      : null;

  const licenseStatusDistribution: Record<string, number> = {};
  for (const record of canonicalRecords) {
    licenseStatusDistribution[record.license_status] = (licenseStatusDistribution[record.license_status] || 0) + 1;
  }

  const publicLicenseRecords = canonicalRecords.filter((record) => record.license_publicly_available);
  const presentLicenseRecords = publicLicenseRecords.filter((record) => record.state_license_number !== null);
  const latLngPresentRecords = canonicalRecords.filter((record) => record.lat !== null && record.lng !== null);
  const certifiedBedsPresentRecords = canonicalRecords.filter((record) => record.certified_beds !== null);
  const unmatchedRecords = canonicalRecords.filter((record) => record.match_method === 'unmatched');
  const freshnessStage = evaluateFreshnessStage(canonicalRecords);

  const qaMetrics = {
    state,
    schema_version: SCHEMA_VERSION,
    data_version: options.dataVersion,
    baseline_reference_version: options.baselineReferenceVersion,
    total_records: canonicalRecords.length,
    license_publicly_available_true_pct: safeRate(publicLicenseRecords.length, canonicalRecords.length),
    state_license_number_present_pct: safeRate(presentLicenseRecords.length, publicLicenseRecords.length),
    lat_lng_present_pct: safeRate(latLngPresentRecords.length, canonicalRecords.length),
    certified_beds_present_pct: safeRate(certifiedBedsPresentRecords.length, canonicalRecords.length),
    match_confidence_avg: confidenceAverage,
    unmatched_rate: safeRate(unmatchedRecords.length, canonicalRecords.length),
    duplicate_signature_count: countDuplicates(canonicalRecords),
    license_status_distribution: licenseStatusDistribution,
    freshness_stage: freshnessStage,
    tier_ruleset_version: INTEGRITY_RULESET_VERSION,
    generated_at: nowIso,
  };

  const publishDecision = {
    state,
    schema_version: SCHEMA_VERSION,
    data_version: options.dataVersion,
    snapshot_hash: snapshotHash,
    baseline_reference_version: options.baselineReferenceVersion,
    enforcement_scope: 'gate1_foundation',
    passed_gates: hardFailures === 0 ? ['G1'] : [],
    failed_gates: hardFailures === 0 ? [] : ['G1'],
    severity: hardFailures === 0 ? 'soft' : 'hard',
    thresholds_triggered: [],
    approved_for_publish: approvedForPublish,
    requires_additional_gates: true,
    override_used: false,
    qa_override_flag: false,
    policy_version: PIPELINE_POLICY_VERSION,
    created_at: nowIso,
  };

  const artifactBundle = {
    state,
    schema_version: SCHEMA_VERSION,
    data_version: options.dataVersion,
    input_manifest: path.join(stateDir, 'input_manifest.json'),
    gate1_failures: path.join(stateDir, 'gate1_failures.json'),
    gate1_check_results: path.join(stateDir, 'gate1_check_results.json'),
    publish_decision: path.join(stateDir, 'publish_decision.json'),
    qa_metrics: path.join(stateDir, 'qa_metrics.json'),
  };

  await writeJson(path.join(stateDir, 'input_manifest.json'), inputManifest);
  await writeJson(path.join(stateDir, 'gate1_failures.json'), failures);
  await writeJson(path.join(stateDir, 'gate1_check_results.json'), checkResults);
  await writeJson(path.join(stateDir, 'publish_decision.json'), publishDecision);
  await writeJson(path.join(stateDir, 'qa_metrics.json'), qaMetrics);
  await writeJson(path.join(stateDir, 'canonical_snapshot.json'), canonicalRecords);
  await writeJson(path.join(stateDir, 'artifact_bundle.json'), artifactBundle);

  return {
    state,
    inputFile: path.basename(filePath),
    totalRecords: canonicalRecords.length,
    failureCount: failures.length,
    approvedForPublish,
  };
};

const main = async () => {
  const options = await parseCli();
  if (options.inputFiles.length === 0) {
    throw new Error('No input state files found. Provide --file <path> or add *_nursing_homes_with_licenses.json files.');
  }

  const nowIso = new Date().toISOString();
  const runId = nowIso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const runDir = path.join(options.outputRoot, runId);
  await fs.mkdir(runDir, { recursive: true });

  const stateResults: StateRunResult[] = [];
  for (const filePath of options.inputFiles) {
    const result = await runForFile(filePath, runDir, options, nowIso);
    stateResults.push(result);
    console.log(
      `[${result.approvedForPublish ? 'PASS' : 'FAIL'}] ${result.state} records=${result.totalRecords} failures=${result.failureCount} file=${result.inputFile}`
    );
  }

  const approved = stateResults.filter((result) => result.approvedForPublish).length;
  const failed = stateResults.length - approved;
  const summary = {
    run_id: runId,
    generated_at: nowIso,
    output_root: runDir,
    schema_version: SCHEMA_VERSION,
    data_version: options.dataVersion,
    baseline_reference_version: options.baselineReferenceVersion,
    state_count: stateResults.length,
    approved_state_count: approved,
    failed_state_count: failed,
    states: stateResults,
  };

  await writeJson(path.join(runDir, 'run_summary.json'), summary);

  if (failed > 0) {
    console.error(`Gate 1 governance run failed for ${failed}/${stateResults.length} states. See ${runDir}`);
    process.exit(1);
  }

  console.log(`Gate 1 governance run passed for ${approved}/${stateResults.length} states. Artifacts: ${runDir}`);
};

main().catch((error) => {
  console.error('run_gate1 crashed:', error);
  process.exit(1);
});
