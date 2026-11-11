// NY category cleanup: tests written BEFORE any implementation (test-first rule, 2026-11-11).
// Expected results come from tests/fixtures/ny-category-sample.json, built from independent evidence:
//   - NY DOH Health Facility General Information register (facility ID -> facility type)
//   - NY OCFS Child Care Regulated Programs register (program name + city)
//   - controls outside the cleanup scope, which must never change.
// Do not weaken assertions or edit expected results without documented approval.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

type SampleRecord = {
  path: string; name: string; state: string; city: string; currentCare: string; license: string;
  uuid: string | null; category: string; expected: string;
  evidence: { source: string; id: string; type: string; registeredName?: string };
};

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8').replace(/\r\n/g, '\n');
const load = async (file: string): Promise<any> => import(pathToFileURL(resolve(root, file)).href);
const sample: SampleRecord[] = JSON.parse(read('tests/fixtures/ny-category-sample.json')).records;
const byCategory = (category: string) => sample.filter((r) => r.category === category);
const retireRecords = sample.filter((r) => r.expected === 'retire');
const keptRecords = sample.filter((r) => r.expected === 'keep' || r.expected === 'unchanged');
const movedRecords = sample.filter((r) => r.expected.startsWith('reclassify:') || r.expected.startsWith('consolidate:'));
const mapPaths = () => new Set(read('data/facility-uuid-map.tsv').split('\n').slice(1).map((l) => l.split('\t')[0]).filter(Boolean));
const redirectRules = () => read('public/_redirects').split('\n').filter((l) => l && !l.startsWith('#'));
const slugId = (p: string) => p.split('/').pop()!;

describe('NY cleanup: the fixed sample is complete and evidenced', () => {
  it('covers legitimate, wrong, ambiguous and out-of-scope records', () => {
    for (const category of [
      'legit_ny_assisted_living', 'ny_adult_day_is_assisted_living', 'ny_adult_day_is_nursing_home',
      'ny_assisted_living_is_nursing_home', 'ny_adult_day_is_clinic_or_agency', 'ny_assisted_living_is_child_care',
      'ny_assisted_living_is_school_program', 'ambiguous_office_for_the_aging', 'control_adult_day_outside_ny',
      'control_ny_nursing_home', 'control_assisted_living_outside_ny',
    ]) {
      expect(byCategory(category).length, category).toBeGreaterThan(0);
    }
    expect(sample.length).toBeGreaterThanOrEqual(30);
  });

  it('every in-scope record carries evidence from an authoritative source', () => {
    for (const r of sample.filter((s) => !s.category.startsWith('control_'))) {
      expect(r.evidence.source, r.path).not.toBe('');
      expect(r.evidence.type, r.path).not.toBe('');
    }
  });
});

describe('NY cleanup: classification (cleanup logic)', () => {
  it('classifies every sample record as expected', async () => {
    const { classifyNyListing, loadRegisters } = await load('scripts/lib/nyCategoryRules.mjs');
    const registers = loadRegisters(root);
    for (const r of sample) {
      expect(classifyNyListing(r, registers), `${r.category}: ${r.path}`).toBe(r.expected);
    }
  });

  it('never classifies a legitimate facility or a control for removal or move', async () => {
    const { classifyNyListing, loadRegisters } = await load('scripts/lib/nyCategoryRules.mjs');
    const registers = loadRegisters(root);
    for (const r of keptRecords) {
      expect(classifyNyListing(r, registers), r.path).toMatch(/^(keep|unchanged)$/);
    }
  });
});

describe('NY cleanup: frozen source-of-truth manifest', () => {
  const manifestFile = 'data/manifest/facility-manifest-2026-11-11.tsv';

  it('exists and records every canonical facility once', () => {
    expect(existsSync(resolve(root, manifestFile))).toBe(true);
    const lines = read(manifestFile).split('\n').filter(Boolean);
    const header = lines[0].split('\t');
    for (const col of ['path', 'uuid', 'care', 'state', 'name', 'license', 'ny_doh_fac_id', 'ny_doh_type', 'status']) {
      expect(header).toContain(col);
    }
    const paths = lines.slice(1).map((l) => l.split('\t')[header.indexOf('path')]);
    expect(paths.length).toBe(78239);
    expect(new Set(paths).size).toBe(paths.length);
  });

  it('freezes each sample record with its original care type and live status', () => {
    const lines = read(manifestFile).split('\n').filter(Boolean);
    const header = lines[0].split('\t');
    const rows = new Map(lines.slice(1).map((l) => { const c = l.split('\t'); return [c[header.indexOf('path')], c]; }));
    for (const r of sample) {
      const row = rows.get(r.path);
      expect(row, r.path).toBeDefined();
      expect(row![header.indexOf('care')], r.path).toBe(r.currentCare);
      expect(row![header.indexOf('status')], r.path).toBe('live');
    }
  });
});

describe('NY cleanup: published inventory after the batch (identity map)', () => {
  it('keeps every legitimate and control page at exactly its current path', () => {
    const paths = mapPaths();
    for (const r of keptRecords) expect(paths.has(r.path), r.path).toBe(true);
  });

  it('removes every retired page', () => {
    const paths = mapPaths();
    for (const r of retireRecords) expect(paths.has(r.path), r.path).toBe(false);
  });

  it('moves reclassified pages to the target care type, keeping the same slug and route id', () => {
    const paths = [...mapPaths()];
    for (const r of sample.filter((s) => s.expected.startsWith('reclassify:'))) {
      const target = r.expected.split(':')[1];
      expect(paths.includes(r.path), `old path still published: ${r.path}`).toBe(false);
      expect(paths.some((p) => p.startsWith(`${target}/`) && slugId(p) === slugId(r.path)), `no ${target} page for ${r.path}`).toBe(true);
    }
  });

  it('consolidates duplicates into the existing page instead of creating a second page', () => {
    const paths = mapPaths();
    for (const r of sample.filter((s) => s.expected.startsWith('consolidate:'))) {
      const target = r.expected.slice('consolidate:'.length);
      expect(paths.has(r.path), `duplicate still published: ${r.path}`).toBe(false);
      expect(paths.has(target), `consolidation target missing: ${target}`).toBe(true);
    }
  });
});

describe('NY cleanup: redirects for retired and moved URLs', () => {
  it('every retired page returns 410 Gone', () => {
    const rules = redirectRules();
    for (const r of retireRecords) expect(rules, r.path).toContain(`/${r.path}/ /410.html 410!`);
  });

  it('every moved page 301s to its new or consolidated URL', () => {
    const rules = redirectRules();
    for (const r of movedRecords) {
      const from = `/${r.path}/ `;
      const rule = rules.find((l) => l.startsWith(from));
      expect(rule, r.path).toBeDefined();
      expect(rule!).toMatch(/ 301!$/);
      if (r.expected.startsWith('consolidate:')) expect(rule!).toContain(` /${r.expected.slice('consolidate:'.length)}/ `);
      else expect(rule!).toContain(` /${r.expected.split(':')[1]}/`);
    }
  });

  it('legitimate and control pages get no redirect rule', () => {
    const rules = redirectRules();
    for (const r of keptRecords) expect(rules.some((l) => l.startsWith(`/${r.path}/ `) || l.startsWith(`/${r.path} `)), r.path).toBe(false);
  });
});

describe('NY cleanup: independent validator rejects planted errors (all-or-nothing)', () => {
  const correctBatch = () => [...retireRecords, ...movedRecords].map((r) => ({ path: r.path, action: r.expected }));
  const validate = async (batch: Array<{ path: string; action: string }>, options: Record<string, unknown> = {}) => {
    const { validateCategoryBatch } = await load('scripts/validate/validateCategoryBatch.mjs');
    return validateCategoryBatch({ root, batch, ...options });
  };

  it('accepts the correct batch', async () => {
    const result = await validate(correctBatch());
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it('rejects the whole batch when one legitimate Adult Home is marked for retirement', async () => {
    const legit = byCategory('legit_ny_assisted_living')[0];
    const result = await validate([...correctBatch(), { path: legit.path, action: 'retire' }]);
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain(legit.path);
  });

  it('rejects retiring an ambiguous record that needs manual review', async () => {
    const ambiguous = byCategory('ambiguous_office_for_the_aging')[0];
    const result = await validate([{ path: ambiguous.path, action: 'retire' }]);
    expect(result.ok).toBe(false);
  });

  it('rejects a reclassification that would duplicate an existing page', async () => {
    const dup = sample.find((r) => r.expected.startsWith('consolidate:'))!;
    const target = dup.expected.split('/')[0].replace('consolidate:', '');
    const result = await validate([{ path: dup.path, action: `reclassify:${target}` }]);
    expect(result.ok).toBe(false);
  });

  it('rejects any record outside the approved scope (not NY)', async () => {
    const outside = byCategory('control_adult_day_outside_ny')[0];
    const result = await validate([{ path: outside.path, action: 'retire' }]);
    expect(result.ok).toBe(false);
  });

  it('rejects a build where a page outside the batch disappeared', async () => {
    const control = byCategory('control_ny_nursing_home')[0];
    const result = await validate(correctBatch(), { simulateMissingPages: [control.path] });
    expect(result.ok).toBe(false);
    expect(result.errors.join('\n')).toContain(control.path);
  });
});

describe('NY cleanup: permanent import gate', () => {
  it('flags new out-of-scope listings and never flags legitimate ones', async () => {
    const { findOutOfScopeListings, loadRegisters } = await load('scripts/lib/nyCategoryRules.mjs');
    const registers = loadRegisters(root);
    const flagged = new Set(findOutOfScopeListings(sample, registers).map((r: SampleRecord) => r.path));
    for (const r of retireRecords) expect(flagged.has(r.path), r.path).toBe(true);
    for (const r of keptRecords) expect(flagged.has(r.path), r.path).toBe(false);
  });
});
