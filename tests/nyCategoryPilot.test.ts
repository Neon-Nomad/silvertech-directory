// Pilot batch 001: additional requirements (written before implementation, 2026-11-11).
// Expected results derive only from the approved batch file and the authoritative registers, not from the implementation.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8').replace(/\r\n/g, '\n');
const load = async (file: string): Promise<any> => import(pathToFileURL(resolve(root, file)).href);

type BatchItem = { path: string; action: string; name: string };
const batch: BatchItem[] = read('data/category-batches/batch-001-pilot.tsv').split('\n').slice(1).filter(Boolean)
  .map((l) => { const [path, action, , name] = l.split('\t'); return { path, action, name }; });
const retired = batch.filter((b) => b.action === 'retire');
const consolidated = batch.filter((b) => b.action.startsWith('consolidate:'));
const reclassified = batch.filter((b) => b.action.startsWith('reclassify:'));
const finalTarget = (b: BatchItem) =>
  b.action.startsWith('consolidate:') ? b.action.slice('consolidate:'.length)
    : `${b.action.slice('reclassify:'.length)}/${b.path.split('/').slice(1).join('/')}`;

type Entry = { k: string; l: string | null; p: string; s?: string; to?: string; was?: string };
const registry = () => JSON.parse(read('data/facility-identity-registry.json')) as { entries: Entry[] };
const rules = () => read('public/_redirects').split('\n').filter((l) => l && !l.startsWith('#')).map((l) => l.trim().split(/\s+/));

describe('pilot 001: the approved batch file', () => {
  it('contains exactly the approved 23 records: 15 retire, 6 consolidate, 2 reclassify', () => {
    expect(batch.length).toBe(23);
    expect(retired.length).toBe(15);
    expect(consolidated.length).toBe(6);
    expect(reclassified.length).toBe(2);
    expect(new Set(batch.map((b) => b.path)).size).toBe(23);
  });
});

describe('pilot 001: identity registry records each decision', () => {
  it('marks retired identities as retired, without deleting them', () => {
    const byPath = new Map(registry().entries.map((e) => [e.p, e]));
    for (const b of retired) expect(byPath.get(b.path)?.s, b.path).toBe('retired');
  });

  it('marks consolidated identities with the existing canonical page they now resolve to', () => {
    const entries = registry().entries;
    const byPath = new Map(entries.map((e) => [e.p, e]));
    const live = new Set(entries.filter((e) => !e.s).map((e) => e.p));
    for (const b of consolidated) {
      const e = byPath.get(b.path);
      expect(e?.s, b.path).toBe('consolidated');
      expect(e?.to, b.path).toBe(finalTarget(b));
      expect(live.has(finalTarget(b)), `target not live: ${finalTarget(b)}`).toBe(true);
    }
  });

  it('moves reclassified identities to the new care-type path, keeping the identity key and slug-id', () => {
    const entries = registry().entries;
    for (const b of reclassified) {
      const e = entries.find((x) => x.was === b.path);
      expect(e, b.path).toBeDefined();
      expect(e!.p).toBe(finalTarget(b));
      expect(e!.s).toBeUndefined();
      expect(e!.p.split('/').pop()).toBe(b.path.split('/').pop());
    }
  });

  it('leaves every other registry entry unchanged and live', () => {
    const touched = new Set([...batch.map((b) => b.path), ...reclassified.map(finalTarget)]);
    const entries = registry().entries;
    expect(entries.length).toBe(78239);
    const nonBatch = entries.filter((e) => !touched.has(e.p) && !(e.was && touched.has(e.was)));
    expect(nonBatch.length).toBe(78239 - 23);
    for (const e of nonBatch) expect(e.s, e.p).toBeUndefined();
  });
});

describe('pilot 001: no redirect chains', () => {
  it('no 301 rule targets a retired, consolidated or old reclassified path', () => {
    const gone = new Set(batch.map((b) => `/${b.path}/`));
    for (const [from, to, status] of rules()) {
      if (status && status.startsWith('301')) expect(gone.has(to), `${from} -> ${to}`).toBe(false);
    }
  });

  it('legacy URLs of retired pages return 410 directly', () => {
    const r = rules();
    for (const b of retired) {
      for (const legacy of legacyForOriginal(b.path)) {
        const rule = r.find(([from]) => from === `/${legacy}/`);
        expect(rule, legacy).toBeDefined();
        expect(rule![2]).toMatch(/^410/);
      }
    }
  });

  it('legacy URLs of moved pages 301 straight to the final destination', () => {
    const r = rules();
    for (const b of [...consolidated, ...reclassified]) {
      for (const legacy of legacyForOriginal(b.path)) {
        const rule = r.find(([from]) => from === `/${legacy}/`);
        expect(rule, legacy).toBeDefined();
        expect(rule![1]).toBe(`/${finalTarget(b)}/`);
        expect(rule![2]).toMatch(/^301/);
      }
    }
  });
});

// Legacy sources are identified from the committed pre-pilot manifest snapshot, so the expectation does not
// depend on how the implementation rewrites data/facility-legacy-redirects.tsv.
function legacyForOriginal(target: string): string[] {
  const snapshot = read('data/manifest/facility-legacy-redirects-2026-11-11.tsv').split('\n').filter((l) => l && !l.startsWith('#'))
    .map((l) => l.split('\t'));
  return snapshot.filter(([, to]) => to === target).map(([from]) => from);
}

describe('pilot 001: import gate catches reintroduced errors', () => {
  it('flags a retired listing and a consolidated duplicate if they reappear in a future import', async () => {
    const { findGateViolations, loadRegisters } = await load('scripts/lib/nyCategoryRules.mjs');
    const registers = loadRegisters(root);
    const sample = JSON.parse(read('tests/fixtures/ny-category-sample.json')).records;
    const reintroduced = sample
      .filter((r: any) => r.expected === 'retire' || r.expected.startsWith('consolidate:'))
      .map((r: any) => ({ ...r, path: r.path.replace(/-(\d+)$/, '-999$1') })); // same facility, new route id
    const flagged = new Set(findGateViolations(reintroduced, registers).map((v: any) => v.path));
    for (const r of reintroduced) expect(flagged.has(r.path), r.path).toBe(true);
  });

  it('does not flag legitimate facilities that reappear', async () => {
    const { findGateViolations, loadRegisters } = await load('scripts/lib/nyCategoryRules.mjs');
    const registers = loadRegisters(root);
    const sample = JSON.parse(read('tests/fixtures/ny-category-sample.json')).records;
    const legit = sample.filter((r: any) => r.expected === 'keep' || r.expected === 'unchanged');
    expect(findGateViolations(legit, registers)).toEqual([]);
  });
});

describe('pilot 001: frozen pre-pilot legacy redirect snapshot exists', () => {
  it('records every legacy source pointing at a pilot page', () => {
    const files = readdirSync(resolve(root, 'data/manifest'));
    expect(files).toContain('facility-legacy-redirects-2026-11-11.tsv');
    for (const b of batch) expect(legacyForOriginal(b.path).length, b.path).toBeGreaterThan(0);
  });
});
