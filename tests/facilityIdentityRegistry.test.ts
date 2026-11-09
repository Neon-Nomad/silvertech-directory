import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8').replace(/\r\n/g, '\n');

type RegistryEntry = { k: string; l: string | null; p: string };
const registry = JSON.parse(read('data/facility-identity-registry.json')) as {
  facilityCount: number;
  canonicalPathsSha256: string;
  entries: RegistryEntry[];
};
const canonicalPaths = registry.entries.map((entry) => entry.p);
const canonicalSet = new Set(canonicalPaths);

type ManifestRow = { from: string; to: string; evidence: string; emit: string };
const manifest: ManifestRow[] = read('data/facility-legacy-redirects.tsv')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((line) => {
    const [from, to, evidence, emit] = line.split('\t');
    return { from, to, evidence, emit };
  });

type Rule = { from: string; to: string; status: number; force: boolean; index: number };
const rules: Rule[] = read('public/_redirects')
  .split('\n')
  .filter((line) => line && !line.startsWith('#'))
  .map((line, index) => {
    const [from, to, statusText] = line.trim().split(/\s+/);
    return { from, to, status: parseInt(statusText, 10), force: statusText.endsWith('!'), index };
  });

// Netlify-style first-match evaluation: ":name" matches one segment, a trailing "*" matches the rest.
const matchesPattern = (pattern: string, requestPath: string): boolean => {
  const patternSegments = pattern.split('/');
  const requestSegments = requestPath.split('/');
  for (let i = 0; i < patternSegments.length; i += 1) {
    const segment = patternSegments[i];
    const isLast = i === patternSegments.length - 1;
    if (isLast && segment.endsWith('*')) {
      return requestSegments.slice(i).join('/').startsWith(segment.slice(0, -1));
    }
    if (i >= requestSegments.length) return false;
    if (segment.startsWith(':')) {
      if (!requestSegments[i]) return false;
      continue;
    }
    if (segment !== requestSegments[i]) return false;
  }
  return patternSegments.length === requestSegments.length;
};

// A rule without placeholders or splats matches only its exact path, so those are indexed by path.
// The remaining (placeholder and splat) rules are few and are checked directly. Original order is preserved.
const isPatternRule = (rule: Rule): boolean => rule.from.includes(':') || rule.from.includes('*');
const literalRulesByPath = new Map<string, Rule[]>();
const patternRules: Rule[] = [];
for (const rule of rules) {
  if (isPatternRule(rule)) {
    patternRules.push(rule);
    continue;
  }
  if (!literalRulesByPath.has(rule.from)) literalRulesByPath.set(rule.from, []);
  literalRulesByPath.get(rule.from)!.push(rule);
}
const matchingRules = (requestPath: string): Rule[] => {
  const literal = literalRulesByPath.get(requestPath) || [];
  const pattern = patternRules.filter((rule) => matchesPattern(rule.from, requestPath));
  return [...literal, ...pattern].sort((a, b) => a.index - b.index);
};
const firstMatch = (requestPath: string): Rule | undefined => matchingRules(requestPath)[0];

const sample = <T>(items: T[], count: number): T[] => {
  const step = Math.max(1, Math.floor(items.length / count));
  return items.filter((_, index) => index % step === 0).slice(0, count);
};

describe('facility identity registry', () => {
  it('holds one canonical path per facility, equal to the verified live set', () => {
    expect(registry.facilityCount).toBe(78239);
    expect(registry.entries.length).toBe(78239);
    expect(canonicalSet.size).toBe(canonicalPaths.length);
    expect(new Set(registry.entries.map((entry) => entry.k)).size).toBe(registry.entries.length);

    const digest = createHash('sha256').update([...canonicalPaths].sort().join('\n')).digest('hex');
    expect(digest).toBe(registry.canonicalPathsSha256);
  });

  it('contains only facility-detail paths in care/state/city/slug-id form', () => {
    for (const value of canonicalPaths) {
      expect(value).toMatch(/^[a-z-]+\/[a-z0-9-]+\/[a-z0-9-]+\/[a-z0-9-]+-\d+$/);
    }
  });
});

describe('verified legacy facility redirects', () => {
  it('points only at live canonical paths and never at a path that is itself canonical', () => {
    const sources = new Set<string>();
    for (const row of manifest) {
      expect(canonicalSet.has(row.to)).toBe(true);
      expect(canonicalSet.has(row.from)).toBe(false);
      expect(sources.has(row.from)).toBe(false);
      sources.add(row.from);
    }
  });

  it('emits every verified legacy source, in both trailing-slash forms (full-file decision)', () => {
    const emitted = manifest.filter((row) => row.emit === 'yes');
    expect(emitted.length).toBe(manifest.length);
    expect(emitted.length).toBe(77720);

    const legacy301 = rules.filter((rule) => rule.status === 301 && canonicalSet.has(rule.to.slice(1, -1)));
    expect(legacy301.length).toBe(emitted.length * 2);
    for (const rule of legacy301) expect(rule.force).toBe(false);
  });

  it('places the legacy 301 block before the generic facility 410 rules', () => {
    const firstLegacy = rules.findIndex((rule) => rule.status === 301 && canonicalSet.has(rule.to.slice(1, -1)));
    const firstStale = rules.findIndex((rule) => rule.status === 410 && rule.from.includes('/:state/:city/:facility'));
    expect(firstLegacy).toBeGreaterThan(-1);
    expect(firstStale).toBeGreaterThan(firstLegacy);
  });

  it('sends each emitted legacy URL, with or without slash, to its verified canonical destination', () => {
    for (const row of manifest.filter((item) => item.emit === 'yes')) {
      for (const form of [`/${row.from}`, `/${row.from}/`]) {
        const rule = firstMatch(form);
        expect(rule, form).toBeDefined();
        expect(rule!.status, form).toBe(301);
        expect(rule!.to, form).toBe(`/${row.to}/`);
      }
    }
  }, 120_000);

  it('redirects a sample spread across the whole manifest, not only the first rows', () => {
    const spread = sample(manifest, 3000);
    expect(spread.length).toBe(3000);
    for (const row of spread) {
      const rule = firstMatch(`/${row.from}`);
      expect(rule, row.from).toBeDefined();
      expect(rule!.status, row.from).toBe(301);
      expect(rule!.to, row.from).toBe(`/${row.to}/`);
    }
  });

  it('never applies a forced or 301 rule to a live canonical page', () => {
    for (const canonical of sample(canonicalPaths, 2000)) {
      for (const rule of matchingRules(`/${canonical}/`)) {
        expect(rule.force, `forced rule matches ${canonical}`).toBe(false);
        expect(rule.status, `redirect matches ${canonical}`).not.toBe(301);
      }
    }
  });
});

const integration = process.env.RUN_INTEGRATION_TESTS === 'true' ? describe : describe.skip;

integration('facility URL generation across builds (RUN_INTEGRATION_TESTS=true)', () => {
  const dump = (cwd: string, out: string) => {
    const result = spawnSync('npx', ['--no-install', 'tsx', 'scripts/dump_facility_identity_snapshot.ts', out], {
      cwd,
      shell: true,
      encoding: 'utf8',
      timeout: 1_200_000,
    });
    expect(result.status, result.stderr).toBe(0);
    return readFileSync(out, 'utf8').replace(/\r\n/g, '\n')
      .split('\n')
      .filter(Boolean)
      .map((line) => (JSON.parse(line) as { path: string }).path)
      .sort();
  };

  it('a clean tree and an existing checkout produce identical facility URLs equal to the registry', () => {
    const scratch = mkdtempSync(join(tmpdir(), 'facility-identity-'));

    // Clean build: the same tracked code and data, no sitemap files, and sitemaps poisoned with other IDs.
    const clean = join(scratch, 'clean');
    mkdirSync(join(clean, 'astro-src'), { recursive: true });
    cpSync(join(root, 'astro-src'), join(clean, 'astro-src'), { recursive: true });
    cpSync(join(root, 'src', 'data'), join(clean, 'src', 'data'), { recursive: true });
    cpSync(join(root, 'data'), join(clean, 'data'), { recursive: true });
    mkdirSync(join(clean, 'scripts'), { recursive: true });
    copyFileSync(join(root, 'scripts', 'dump_facility_identity_snapshot.ts'), join(clean, 'scripts', 'dump_facility_identity_snapshot.ts'));
    copyFileSync(join(root, 'all_senior_living_complete.csv'), join(clean, 'all_senior_living_complete.csv'));
    copyFileSync(join(root, 'package.json'), join(clean, 'package.json'));
    copyFileSync(join(root, 'tsconfig.json'), join(clean, 'tsconfig.json'));
    mkdirSync(join(clean, 'public'), { recursive: true });
    writeFileSync(
      join(clean, 'public', 'sitemap-facilities-1.xml'),
      '<urlset><url><loc>https://silvertechdirectory.com/assisted-living/maine/brunswick/old-portland-road-b-1/</loc></url></urlset>',
    );
    symlinkSync(join(root, 'node_modules'), join(clean, 'node_modules'), 'junction');

    const cleanPaths = dump(clean, join(scratch, 'clean.jsonl'));
    const checkoutPaths = dump(root, join(scratch, 'checkout.jsonl'));
    const expected = [...canonicalPaths].sort();

    expect(cleanPaths.length).toBe(78239);
    expect(cleanPaths).toEqual(expected);
    expect(checkoutPaths).toEqual(expected);
  }, 3_600_000);
});
