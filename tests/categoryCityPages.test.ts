// Emptied city pages (approved 2026-11-11): a care-type city page that was live in the frozen production baseline
// and is no longer built because a cleanup batch removed its last listing must return 410. City pages that are still
// built, or that never existed, get no 410 rule. Written before the implementation.
// Needs the facility export (all_senior_living_complete.csv), as the build does; skipped only when it is absent.
// The same rule is enforced at build time by scripts/validate/import_gate.ts.
import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const read = (file: string) => readFileSync(resolve(root, file), 'utf8').replace(/\r\n/g, '\n');
const hasExport = existsSync(resolve(root, 'all_senior_living_complete.csv'));

describe.skipIf(!hasExport)('emptied care-type city pages return 410', { timeout: 300_000 }, () => {
  const baseline = read('data/manifest/care-city-pages-2026-11-11.txt').split('\n').filter((l) => l && !l.startsWith('#'));
  const rules = read('public/_redirects').split('\n').filter((l) => l && !l.startsWith('#'));
  const batchCities = new Set(
    readdirSync(resolve(root, 'data/category-batches')).filter((f) => f.endsWith('.tsv'))
      .flatMap((f) => read(`data/category-batches/${f}`).split('\n').slice(1).filter(Boolean))
      .map((l) => l.split('\t')[0].split('/').slice(0, 3).join('/')),
  );
  const builtCities = async () => {
    const store: any = await import(pathToFileURL(resolve(root, 'astro-src/lib/seniorLivingData.ts')).href);
    return new Set<string>(store.getCareCityStaticPaths().map((e: any) => `${e.care}/${e.state}/${e.city}`));
  };
  const cityRule410 = (r: string) => /^\/[a-z-]+\/[a-z0-9-]+\/[a-z0-9-]+\/? \/410\.html 410!$/.test(r);

  it('every baseline city page that is no longer built returns 410 in both slash forms', async () => {
    const built = await builtCities();
    const emptied = baseline.filter((p) => !built.has(p));
    for (const p of emptied) {
      expect(rules, p).toContain(`/${p}/ /410.html 410!`);
      expect(rules, p).toContain(`/${p} /410.html 410!`);
    }
  });

  it('only a cleanup batch can empty a city page', async () => {
    const built = await builtCities();
    for (const p of baseline.filter((c) => !built.has(c))) expect(batchCities.has(p), `emptied without a batch: ${p}`).toBe(true);
  });

  it('no city page that is built, or that never existed, gets a 410 rule', async () => {
    const built = await builtCities();
    const emptied = new Set(baseline.filter((p) => !built.has(p)));
    for (const r of rules.filter(cityRule410)) {
      const p = r.split(' ')[0].replace(/^\//, '').replace(/\/$/, '');
      expect(emptied.has(p), `unexpected city 410: ${r}`).toBe(true);
    }
  });
});
