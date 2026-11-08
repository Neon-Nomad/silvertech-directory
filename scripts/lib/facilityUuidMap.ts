// Deterministic mapping from canonical static facility identities to Supabase facility UUIDs.
// Pure functions only: the build script and the validator both use these, and the tests exercise them.
//
// Rules (see docs/proposed/facility-uuid-mapping-report-2026-11-07.md):
// - A candidate database row must share the state and the normalized city and name.
// - A candidate is scored on independent identifiers: street with ZIP, phone, CMS number, state license.
// - Only the single highest-scoring candidate is accepted, and only at score >= 5.
// - Ties are never resolved. Each tied identity is reported with its candidate UUIDs.
// - A UUID that is accepted for one identity and is also a candidate for another is unresolved.
// - A UUID accepted for two identities is unresolved on both.
// - Decisions (reviewed selections among tie candidates) are applied only to candidates of that tie.

export type StaticIdentity = {
  path: string;
  name: string;
  city: string;
  state: string;
  street: string | null;
  zip: string | null;
  phone: string | null;
  licenseNumber: string | null;
  cmsCertificationNumber: string | null;
};

export type DatabaseRow = {
  id: string;
  name: string;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  phone: string | null;
  state_license_number: string | null;
  cms_certification_number: string | null;
};

export type Decision = { path: string; uuid: string; reason: string; approvedBy: string };

export type MapRow =
  | { path: string; status: 'mapped'; uuid: string; reason: 'unique' | 'approved_selection'; identifiers: string[]; score: number }
  | { path: string; status: 'unresolved'; uuid: ''; reason: 'duplicate_rows' | 'duplicate_rows_near' | 'cross_identity_conflict' | 'uuid_claimed_twice' | 'no_match' | 'insufficient_evidence'; candidates: string[] };

export const MIN_SCORE = 5;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ABBR: Record<string, string> = { street: 'st', avenue: 'ave', road: 'rd', boulevard: 'blvd', drive: 'dr', lane: 'ln', highway: 'hwy', parkway: 'pkwy', court: 'ct', circle: 'cir', place: 'pl', north: 'n', south: 's', east: 'e', west: 'w' };

export const norm = (s: unknown): string =>
  String(s ?? '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

// A leading # belongs to the house number ("#2 MAIN ST" is "2 MAIN ST"). A # after the street text
// starts a unit designator, which is dropped with everything that follows it.
export const streetKey = (s: unknown): string => {
  const raw = String(s ?? '').trim();
  const body = raw.startsWith('#') ? raw.slice(1) : raw.split('#')[0];
  return norm(body.replace(/\b(suite|ste|unit|apt|floor|fl)\b.*$/i, ''))
    .split(' ').map((w) => ABBR[w] || w).filter(Boolean).join(' ');
};

export const zip5 = (z: unknown): string => {
  const d = String(z ?? '').replace(/\D/g, '');
  return d.length >= 5 ? d.slice(0, 5) : '';
};

export const phone10 = (p: unknown): string => {
  const d = String(p ?? '').replace(/\D/g, '');
  return d.length >= 10 ? d.slice(-10) : '';
};

export const code = (c: unknown): string => String(c ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const tokens = (s: unknown): Set<string> => new Set(norm(s).split(' ').filter((w) => w.length > 1));

export const jaccard = (a: unknown, b: unknown): number => {
  const A = tokens(a);
  const B = tokens(b);
  if (!A.size || !B.size) return 0;
  let shared = 0;
  for (const t of A) if (B.has(t)) shared++;
  return shared / (A.size + B.size - shared);
};

export type Scored = { row: DatabaseRow; total: number; parts: Record<'name' | 'street' | 'phone' | 'cms' | 'license', number> };

export function scoreCandidate(f: StaticIdentity, r: DatabaseRow): Scored {
  const parts = {
    name: norm(f.name) && norm(f.name) === norm(r.name) ? 3 : jaccard(f.name, r.name) >= 0.6 ? 2 : 0,
    street: streetKey(f.street) && streetKey(f.street) === streetKey(r.address_line1) && zip5(f.zip) === zip5(r.postal_code) ? 2 : 0,
    phone: phone10(f.phone) && phone10(f.phone) === phone10(r.phone) ? 2 : 0,
    cms: code(f.cmsCertificationNumber) && code(f.cmsCertificationNumber) === code(r.cms_certification_number) ? 3 : 0,
    license: code(f.licenseNumber) && code(f.licenseNumber) === code(r.state_license_number) ? 2 : 0,
  } as Scored['parts'];
  return { row: r, total: Object.values(parts).reduce((a, b) => a + b, 0), parts };
}

// Candidate index: rows are looked up only by state+ZIP or state+name, and skip empty keys so no bucket is huge.
export function buildIndex(db: DatabaseRow[]) {
  const byZip = new Map<string, DatabaseRow[]>();
  const byName = new Map<string, DatabaseRow[]>();
  const add = (m: Map<string, DatabaseRow[]>, k: string, v: DatabaseRow) => {
    if (!m.has(k)) m.set(k, []);
    m.get(k)!.push(v);
  };
  for (const r of db) {
    const z = zip5(r.postal_code);
    const n = norm(r.name);
    if (z) add(byZip, `${r.state}|${z}`, r);
    if (n) add(byName, `${r.state}|${n}`, r);
  }
  return { byZip, byName };
}

const sig = (r: DatabaseRow) => [norm(r.name), streetKey(r.address_line1), zip5(r.postal_code), phone10(r.phone)].join('|');

type Raw =
  | { path: string; kind: 'unique'; uuid: string; identifiers: string[]; score: number }
  | { path: string; kind: 'insufficient'; uuid: string; identifiers: string[]; score: number }
  | { path: string; kind: 'tie'; candidates: string[]; identical: boolean }
  | { path: string; kind: 'no_match' };

// Step 1: per identity, the candidate decision before reconciliation.
export function matchIdentities(statics: StaticIdentity[], db: DatabaseRow[]): Raw[] {
  const { byZip, byName } = buildIndex(db);
  const out: Raw[] = [];
  for (const f of statics) {
    const pool = new Map<string, DatabaseRow>();
    for (const r of [...(byZip.get(`${f.state}|${zip5(f.zip)}`) || []), ...(byName.get(`${f.state}|${norm(f.name)}`) || [])]) pool.set(r.id, r);
    const scored = [...pool.values()]
      .filter((r) => norm(r.city) === norm(f.city))
      .map((r) => scoreCandidate(f, r))
      .filter((s) => s.parts.name === 3 && s.total > 0)
      .sort((a, b) => b.total - a.total || (a.row.id < b.row.id ? -1 : 1));
    if (!scored.length || scored[0].total < MIN_SCORE) { out.push({ path: f.path, kind: 'no_match' }); continue; }
    const top = scored.filter((s) => s.total === scored[0].total);
    if (top.length === 1) {
      const p = top[0].parts;
      const identifiers = ['name', ...(['street', 'phone', 'cms', 'license'] as const).filter((k) => p[k] > 0)];
      // Sufficient evidence: an address match (street with ZIP), or at least two of phone, CMS number, and license number.
      const independent = [p.phone, p.cms, p.license].filter((x) => x > 0).length;
      const sufficient = p.street > 0 || independent >= 2;
      out.push(sufficient
        ? { path: f.path, kind: 'unique', uuid: top[0].row.id, identifiers, score: top[0].total }
        : { path: f.path, kind: 'insufficient', uuid: top[0].row.id, identifiers, score: top[0].total });
      continue;
    }
    const identical = top.every((s) => sig(s.row) === sig(top[0].row));
    out.push({ path: f.path, kind: 'tie', candidates: top.map((s) => s.row.id).sort(), identical });
  }
  return out;
}

// Step 2: reconcile, then apply reviewed decisions. Returns one row per identity, sorted by path.
export function reconcile(raw: Raw[], decisions: Decision[] = []): MapRow[] {
  const tieCandidates = new Set<string>();
  for (const r of raw) if (r.kind === 'tie') for (const id of r.candidates) tieCandidates.add(id);
  const uniqueCount = new Map<string, number>();
  for (const r of raw) if (r.kind === 'unique') uniqueCount.set(r.uuid, (uniqueCount.get(r.uuid) || 0) + 1);

  const rows: MapRow[] = raw.map((r): MapRow => {
    if (r.kind === 'no_match') return { path: r.path, status: 'unresolved', uuid: '', reason: 'no_match', candidates: [] };
    if (r.kind === 'insufficient') return { path: r.path, status: 'unresolved', uuid: '', reason: 'insufficient_evidence', candidates: [r.uuid] };
    if (r.kind === 'tie') {
      return { path: r.path, status: 'unresolved', uuid: '', reason: r.identical ? 'duplicate_rows' : 'duplicate_rows_near', candidates: r.candidates };
    }
    if (tieCandidates.has(r.uuid)) return { path: r.path, status: 'unresolved', uuid: '', reason: 'cross_identity_conflict', candidates: [r.uuid] };
    if ((uniqueCount.get(r.uuid) || 0) > 1) return { path: r.path, status: 'unresolved', uuid: '', reason: 'uuid_claimed_twice', candidates: [r.uuid] };
    return { path: r.path, status: 'mapped', uuid: r.uuid, reason: 'unique', identifiers: r.identifiers, score: r.score };
  });

  const byPath = new Map(rows.map((r) => [r.path, r]));
  for (const d of decisions) {
    const row = byPath.get(d.path);
    if (!row || row.status !== 'unresolved' || (row.reason !== 'duplicate_rows' && row.reason !== 'duplicate_rows_near')) continue;
    if (!row.candidates.includes(d.uuid)) continue;
    byPath.set(d.path, { path: d.path, status: 'mapped', uuid: d.uuid, reason: 'approved_selection', identifiers: [d.reason], score: 0 });
  }
  return [...byPath.values()].sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

export const HEADER = 'path\tstatus\tuuid\treason\tidentifiers_or_candidates\tscore';

export function serialize(rows: MapRow[]): string {
  const lines = rows.map((r) => {
    if (r.status === 'mapped') return [r.path, 'mapped', r.uuid, r.reason, r.identifiers.join(','), String(r.score)].join('\t');
    return [r.path, 'unresolved', '', r.reason, r.candidates.join(','), ''].join('\t');
  });
  return [HEADER, ...lines].join('\n') + '\n';
}

export function parse(text: string): MapRow[] {
  const lines = text.split('\n').filter((l) => l.length > 0);
  if (lines[0] !== HEADER) throw new Error('map header does not match the expected columns');
  return lines.slice(1).map((line): MapRow => {
    const [path, status, uuid, reason, list, score] = line.split('\t');
    if (status === 'mapped') return { path, status, uuid, reason: reason as 'unique' | 'approved_selection', identifiers: list ? list.split(',') : [], score: Number(score) };
    if (uuid) throw new Error(`unresolved row carries a UUID: ${path}`);
    return { path, status: 'unresolved', uuid: '', reason: reason as Exclude<MapRow['reason'], 'unique' | 'approved_selection'>, candidates: list ? list.split(',') : [] };
  });
}

export function summarize(rows: MapRow[]) {
  const counts: Record<string, number> = {};
  for (const r of rows) {
    const key = r.status === 'mapped' ? `mapped:${r.reason}` : `unresolved:${r.reason}`;
    counts[key] = (counts[key] || 0) + 1;
  }
  return { total: rows.length, mapped: rows.filter((r) => r.status === 'mapped').length, unresolved: rows.filter((r) => r.status === 'unresolved').length, counts };
}

const keyOf = (r: MapRow) => (r.status === 'mapped' ? `mapped:${r.uuid}` : `unresolved:${r.reason}`);

// Every identity whose mapping differs from the previous map. needsReview marks identity changes:
// a mapping that changed, a mapping removed, or a new identity that is mapped. A new identity that
// stays unresolved is not an identity change, so it needs no review.
export type MapChange = { path: string; before: string | null; after: string | null; needsReview: boolean };

export function changesAgainst(previous: MapRow[], rows: MapRow[]): MapChange[] {
  const prev = new Map(previous.map((r) => [r.path, r]));
  const next = new Map(rows.map((r) => [r.path, r]));
  const changes: MapChange[] = [];
  for (const r of rows) {
    const before = prev.get(r.path);
    if (!before) {
      changes.push({ path: r.path, before: null, after: keyOf(r), needsReview: r.status === 'mapped' });
    } else if (keyOf(before) !== keyOf(r)) {
      changes.push({ path: r.path, before: keyOf(before), after: keyOf(r), needsReview: true });
    }
  }
  for (const p of prev.keys()) {
    if (!next.has(p)) changes.push({ path: p, before: keyOf(prev.get(p)!), after: null, needsReview: true });
  }
  return changes.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}

// Reviewed-change file: one line per approved identity change, "path<TAB>reviewer<TAB>reason".
export function parseReviewed(text: string): { path: string; reviewer: string; reason: string }[] {
  return text.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim() && !l.startsWith('#')).map((line) => {
    const [path, reviewer, reason] = line.split('\t');
    if (!path || !reviewer || !reason) throw new Error(`reviewed line needs path, reviewer and reason: ${line.slice(0, 120)}`);
    return { path: path.trim(), reviewer: reviewer.trim(), reason: reason.trim() };
  });
}

// Validation: returns a list of problems. An empty list means the map may be used.
// requireComplete (default true): every canonical identity must have a row. The Netlify build passes false,
// so a facility added after the last regeneration renders the explicit unavailable state instead of failing the build.
export function validate(input: {
  rows: MapRow[];
  canonicalPaths: string[];
  database?: DatabaseRow[];
  statics: StaticIdentity[];
  decisions: Decision[];
  previous?: MapRow[];
  reviewedChanges?: string[];
  requireComplete?: boolean;
}): string[] {
  const problems: string[] = [];
  const canonical = new Set(input.canonicalPaths);
  const seenPaths = new Set<string>();
  const dbById = input.database ? new Map(input.database.map((r) => [r.id, r])) : null;
  const staticByPath = new Map(input.statics.map((s) => [s.path, s]));
  const mappedUuids = new Map<string, string>();

  for (const r of input.rows) {
    if (seenPaths.has(r.path)) problems.push(`duplicate path row: ${r.path}`);
    seenPaths.add(r.path);
    if (!canonical.has(r.path)) problems.push(`path is not a canonical facility identity: ${r.path}`);
    if (r.status === 'mapped') {
      if (!UUID_PATTERN.test(r.uuid)) problems.push(`mapped row has an invalid UUID: ${r.path}`);
      const other = mappedUuids.get(r.uuid);
      if (other) problems.push(`UUID assigned to two identities: ${r.uuid} (${other} and ${r.path})`);
      mappedUuids.set(r.uuid, r.path);
      if (dbById) {
        const dbRow = dbById.get(r.uuid);
        const s = staticByPath.get(r.path);
        if (!dbRow) problems.push(`mapped UUID is not in the database export: ${r.path}`);
        if (dbRow && s && (norm(dbRow.name) !== norm(s.name) || norm(dbRow.city) !== norm(s.city) || (dbRow.state || '') !== s.state)) {
          problems.push(`mapped row disagrees on name, city or state: ${r.path}`);
        }
      }
    } else {
      if (!r.reason) problems.push(`unresolved row has no reason: ${r.path}`);
    }
  }

  if (input.requireComplete !== false) {
    for (const p of canonical) if (!seenPaths.has(p)) problems.push(`missing identity mapping: ${p}`);
  }

  for (const d of input.decisions) {
    const row = input.rows.find((r) => r.path === d.path);
    if (!row) { problems.push(`decision for unknown path: ${d.path}`); continue; }
    if (row.status !== 'mapped' || row.reason !== 'approved_selection' || row.uuid !== d.uuid) {
      problems.push(`decision not reflected in the map: ${d.path}`);
    }
    if (!d.approvedBy) problems.push(`decision has no approver: ${d.path}`);
  }

  if (input.previous) {
    const reviewed = new Set(input.reviewedChanges || []);
    const changes = changesAgainst(input.previous, input.rows);
    const reviewable = new Set(changes.filter((c) => c.needsReview).map((c) => c.path));
    for (const c of changes) {
      if (!c.needsReview || reviewed.has(c.path)) continue;
      const what = c.after === null ? 'removed' : c.before === null ? 'added as mapped' : `changed (${c.before} -> ${c.after})`;
      problems.push(`identity ${what} without review: ${c.path}`);
    }
    for (const p of reviewed) if (!reviewable.has(p)) problems.push(`review entry matches no identity change: ${p}`);
  }

  return problems;
}
