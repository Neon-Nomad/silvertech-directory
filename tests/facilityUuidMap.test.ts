import { describe, expect, it } from 'vitest';
import {
  matchIdentities,
  parse,
  parseReviewed,
  reconcile,
  serialize,
  streetKey,
  validate,
  type DatabaseRow,
  type MapRow,
  type StaticIdentity,
} from '../scripts/lib/facilityUuidMap';

const U = (n: number) => `${n.toString().padStart(8, '0')}-1111-4111-8111-111111111111`;

const statics = (overrides: Partial<StaticIdentity>[] = []): StaticIdentity[] => {
  const base: StaticIdentity = {
    path: 'assisted-living/mn/minneapolis/alpha-house-1',
    name: 'Alpha House',
    city: 'Minneapolis',
    state: 'MN',
    street: '100 Main Street',
    zip: '55401',
    phone: '(612) 555-0100',
    licenseNumber: null,
    cmsCertificationNumber: null,
  };
  return overrides.length ? overrides.map((o, i) => ({ ...base, path: `assisted-living/mn/minneapolis/house-${i + 1}`, ...o })) : [base];
};

const row = (id: number, o: Partial<DatabaseRow> = {}): DatabaseRow => ({
  id: U(id),
  name: 'Alpha House',
  address_line1: '100 Main St',
  city: 'Minneapolis',
  state: 'MN',
  postal_code: '55401',
  phone: '612-555-0100',
  state_license_number: null,
  cms_certification_number: null,
  ...o,
});

describe('matching rules', () => {
  it('maps a single row that agrees on name, city, and address', () => {
    const raw = matchIdentities(statics(), [row(1)]);
    expect(raw[0]).toMatchObject({ kind: 'unique', uuid: U(1) });
    const rows = reconcile(raw);
    expect(rows[0]).toMatchObject({ status: 'mapped', uuid: U(1), reason: 'unique' });
  });

  it('never maps on address alone: the name must agree', () => {
    const raw = matchIdentities(statics(), [row(1, { name: 'Different Building' })]);
    expect(raw[0].kind).toBe('no_match');
  });

  it('never maps across cities, even when name and address agree', () => {
    const raw = matchIdentities(statics(), [row(1, { city: 'St Paul' })]);
    expect(raw[0].kind).toBe('no_match');
  });

  it('reports identical duplicate rows as a tie and never selects one', () => {
    const raw = matchIdentities(statics(), [row(1), row(2)]);
    expect(raw[0]).toMatchObject({ kind: 'tie', identical: true });
    const rows = reconcile(raw);
    expect(rows[0]).toMatchObject({ status: 'unresolved', reason: 'duplicate_rows' });
    expect(rows[0].status === 'unresolved' && rows[0].candidates).toEqual([U(1), U(2)]);
  });

  it('reports duplicates that differ only in an identifier as near duplicates, still unresolved', () => {
    // The static phone matches neither row, so both score the same; the rows differ in phone, so they are near duplicates.
    const dataset = [row(1, { phone: '612-555-0100' }), row(2, { phone: '612-555-0199' })];
    const raw = matchIdentities(statics([{ phone: '(612) 555-0123' }]), dataset);
    const rows = reconcile(raw);
    expect(rows[0]).toMatchObject({ status: 'unresolved', reason: 'duplicate_rows_near' });
  });

  it('leaves an identity unmatched when nothing reaches the threshold', () => {
    const raw = matchIdentities(statics(), [row(1, { name: 'Alpha House', address_line1: '999 Other Rd', postal_code: '55999', phone: null })]);
    expect(raw[0].kind).toBe('no_match');
  });
});

describe('reconciliation', () => {
  it('flags a UUID that is accepted for one identity and is also a candidate for another', () => {
    // Identity 1 matches row 1 uniquely (phone agrees). Identity 2 matches rows 1 and 2 equally (phone agrees with neither),
    // so row 1 is both identity 1's unique match and a tie candidate for identity 2.
    const two = statics([{ phone: '(612) 555-0100' }, { path: 'nursing-homes/mn/minneapolis/alpha-house-2', phone: '(612) 555-0123' }]);
    const dataset = [row(1, { phone: '612-555-0100' }), row(2, { phone: '612-555-0199' })];
    const raw = matchIdentities(two, dataset);
    const rows = reconcile(raw);
    const conflicted = rows.filter((r) => r.status === 'unresolved' && r.reason === 'cross_identity_conflict');
    expect(conflicted.length).toBeGreaterThan(0);
    expect(rows.some((r) => r.status === 'mapped' && r.uuid === U(1))).toBe(false);
  });

  it('applies a reviewed decision only to a candidate of that tie', () => {
    const raw = matchIdentities(statics(), [row(1), row(2)]);
    const applied = reconcile(raw, [{ path: statics()[0].path, uuid: U(2), reason: 'owner reviewed', approvedBy: 'owner' }]);
    expect(applied[0]).toMatchObject({ status: 'mapped', uuid: U(2), reason: 'approved_selection' });
    const ignored = reconcile(raw, [{ path: statics()[0].path, uuid: U(99), reason: 'not a candidate', approvedBy: 'owner' }]);
    expect(ignored[0]).toMatchObject({ status: 'unresolved' });
  });
});

describe('file format', () => {
  it('round-trips and rejects a UUID on an unresolved row', () => {
    const rows: MapRow[] = [
      { path: 'a/x', status: 'mapped', uuid: U(1), reason: 'unique', identifiers: ['name', 'street'], score: 8 },
      { path: 'b/y', status: 'unresolved', uuid: '', reason: 'duplicate_rows', candidates: [U(2), U(3)] },
    ];
    expect(parse(serialize(rows))).toEqual(rows);
    const bad = serialize(rows).replace('b/y\tunresolved\t\tduplicate_rows', `b/y\tunresolved\t${U(2)}\tduplicate_rows`);
    expect(() => parse(bad)).toThrow(/carries a UUID/);
  });
});

describe('validation', () => {
  const canonical = ['a/x', 'b/y'];
  const sts: StaticIdentity[] = [
    { ...statics()[0], path: 'a/x' },
    { ...statics()[0], path: 'b/y', name: 'Beta House' },
  ];
  const good: MapRow[] = [
    { path: 'a/x', status: 'mapped', uuid: U(1), reason: 'unique', identifiers: ['name'], score: 8 },
    { path: 'b/y', status: 'unresolved', uuid: '', reason: 'no_match', candidates: [] },
  ];
  const run = (rows: MapRow[], extra: Partial<Parameters<typeof validate>[0]> = {}) =>
    validate({ rows, canonicalPaths: canonical, statics: sts, decisions: [], ...extra });

  it('accepts a well-formed map', () => {
    expect(run(good)).toEqual([]);
  });

  it('rejects a UUID assigned to two identities', () => {
    const dup: MapRow[] = [good[0], { path: 'b/y', status: 'mapped', uuid: U(1), reason: 'unique', identifiers: ['name'], score: 8 }];
    expect(run(dup).join(' ')).toMatch(/assigned to two identities/);
  });

  it('rejects a missing identity mapping', () => {
    expect(run([good[0]]).join(' ')).toMatch(/missing identity mapping: b\/y/);
  });

  it('rejects a path that is not a canonical identity', () => {
    const extra: MapRow[] = [...good, { path: 'zzz/unknown', status: 'unresolved', uuid: '', reason: 'no_match', candidates: [] }];
    expect(run(extra).join(' ')).toMatch(/not a canonical facility identity/);
  });

  it('rejects a changed mapping that has not been reviewed, and accepts it once reviewed', () => {
    const changed: MapRow[] = [{ ...good[0], uuid: U(7) }, good[1]];
    const previous = good;
    expect(run(changed, { previous }).join(' ')).toMatch(/identity changed .* without review: a\/x/);
    expect(run(changed, { previous, reviewedChanges: ['a/x'] })).toEqual([]);
  });

  it('requires review for a new identity that is mapped, but not for a new identity that stays unresolved', () => {
    const added: MapRow = { path: 'c/z', status: 'mapped', uuid: U(9), reason: 'unique', identifiers: ['name', 'street'], score: 7 };
    const unresolvedNew: MapRow = { path: 'c/z', status: 'unresolved', uuid: '', reason: 'no_match', candidates: [] };
    const grown = ['a/x', 'b/y', 'c/z'];
    const withAdded = [...good, added];
    expect(run(withAdded, { previous: good, canonicalPaths: grown }).join(' ')).toMatch(/identity added as mapped without review: c\/z/);
    expect(run(withAdded, { previous: good, canonicalPaths: grown, reviewedChanges: ['c/z'] })).toEqual([]);
    expect(run([...good, unresolvedNew], { previous: good, canonicalPaths: grown })).toEqual([]);
  });

  it('requires review for a removed identity and a changed unresolved reason', () => {
    expect(run([good[0]], { previous: good, requireComplete: false }).join(' ')).toMatch(/identity removed without review: b\/y/);
    const reason: MapRow[] = [good[0], { ...good[1], reason: 'duplicate_rows' } as MapRow];
    expect(run(reason, { previous: good }).join(' ')).toMatch(/identity changed \(unresolved:no_match -> unresolved:duplicate_rows\) without review: b\/y/);
  });

  it('rejects a review entry that matches no identity change', () => {
    expect(run(good, { previous: good, reviewedChanges: ['a/x'] }).join(' ')).toMatch(/review entry matches no identity change: a\/x/);
  });

  it('allows an identity with no row in build mode, and still requires one when complete coverage is requested', () => {
    expect(run([good[0]], { requireComplete: false })).toEqual([]);
    expect(run([good[0]]).join(' ')).toMatch(/missing identity mapping: b\/y/);
  });

  it('parses reviewed-change lines and requires a reviewer and a reason', () => {
    expect(parseReviewed('# comment\na/x\towner\tcity renamed\n')).toEqual([{ path: 'a/x', reviewer: 'owner', reason: 'city renamed' }]);
    expect(() => parseReviewed('a/x\t\treason')).toThrow(/needs path, reviewer and reason/);
  });

  it('rejects a decision without an approver, and a decision not reflected in the map', () => {
    expect(run(good, { decisions: [{ path: 'a/x', uuid: U(1), reason: 'r', approvedBy: '' }] }).join(' ')).toMatch(/no approver/);
    expect(run(good, { decisions: [{ path: 'b/y', uuid: U(2), reason: 'r', approvedBy: 'owner' }] }).join(' ')).toMatch(/not reflected/);
  });

  it('rejects a mapped UUID that is absent from the database export, and a name mismatch', () => {
    const db = [row(2, { name: 'Alpha House' })];
    expect(run(good, { database: db }).join(' ')).toMatch(/not in the database export/);
    const db2 = [row(1, { name: 'Someone Else' })];
    expect(run(good, { database: db2 }).join(' ')).toMatch(/disagrees on name/);
  });
});

describe('street normalization and evidence', () => {
  it('keeps the house number when the street begins with a hash', () => {
    expect(streetKey('#2 NAZARETH LANE')).toBe('2 nazareth ln');
  });

  it('drops a unit designator that follows the street', () => {
    expect(streetKey('100 Main St #5')).toBe('100 main st');
    expect(streetKey('100 Main Street, Suite 2')).toBe('100 main st');
  });

  it('matches a leading-hash street to its database form', () => {
    const f = statics([{ street: '#2 Nazareth Lane', name: 'Nazareth Living Center', zip: '63129', phone: null }]);
    const raw = matchIdentities(f, [row(1, { name: 'Nazareth Living Center', address_line1: '2 NAZARETH LN', postal_code: '63129', phone: null })]);
    expect(raw[0]).toMatchObject({ kind: 'unique' });
  });

  it('leaves a name with one non-address identifier unresolved as insufficient evidence', () => {
    const f = statics([{ street: 'Unknown Lane', zip: '99999', phone: '(612) 555-0100', name: 'Beta Home' }]);
    const raw = matchIdentities(f, [row(1, { name: 'Beta Home', address_line1: '1 Other St', postal_code: '11111', phone: '612-555-0100' })]);
    expect(raw[0]).toMatchObject({ kind: 'insufficient' });
    expect(reconcile(raw)[0]).toMatchObject({ status: 'unresolved', reason: 'insufficient_evidence' });
  });

  it('accepts a name with two independent identifiers and no address match', () => {
    const f = statics([{ street: 'Unknown Lane', zip: '99999', phone: '(612) 555-0100', licenseNumber: 'LIC-9', name: 'Gamma Home' }]);
    const raw = matchIdentities(f, [row(1, { name: 'Gamma Home', address_line1: '1 Other St', postal_code: '11111', phone: '612-555-0100', state_license_number: 'LIC9' })]);
    expect(raw[0]).toMatchObject({ kind: 'unique' });
  });
});
