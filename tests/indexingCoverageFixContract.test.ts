import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('indexing coverage fix contract', () => {
  it('adds canonical redirects for legacy and host-variant URLs', () => {
    const netlifyConfig = read('netlify.toml');

    expect(netlifyConfig).toContain('from = "http://www.silvertechdirectory.com/*"');
    expect(netlifyConfig).toContain('from = "http://silvertechdirectory.com/*"');
    expect(netlifyConfig).toContain('from = "/assisted-living/:state/cities/:city"');
    expect(netlifyConfig).toContain('to = "/senior-living/:state/:city/"');
  });

  it('keeps generated _redirects aligned to canonical host and legacy path rules', () => {
    const redirectsGenerator = read('scripts/generate_redirects.ts');

    expect(redirectsGenerator).toContain('http://www.silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!');
    expect(redirectsGenerator).toContain('/assisted-living/:state/cities/:city /senior-living/:state/:city/ 301');
    expect(redirectsGenerator).toContain("state_license_number");
    expect(redirectsGenerator).toContain('const buildFacilityRouteId = (facility: FacilityRedirectSeedRow): string =>');
  });

  it('ships static states pages into dist during hybrid merge', () => {
    const mergeScript = read('scripts/merge_astro.mjs');

    expect(mergeScript).toContain("path.join(astroRoot, 'states')");
    expect(mergeScript).toContain("path.join(root, 'dist', 'states')");
  });

  it('provides an indexable static regulations page under /states/:state/regulations', () => {
    const regulationsTemplate = read('astro-src/pages/states/[state]/regulations/index.astro');

    expect(regulationsTemplate).toContain('export async function getStaticPaths()');
    expect(regulationsTemplate).toContain('const canonical = `https://silvertechdirectory.com/states/${stateMeta.slug}/regulations/`;');
    expect(regulationsTemplate).toContain('<h1>{stateMeta.name} Senior Care Regulations</h1>');
  });

  it('includes state regulations URLs in generated sitemaps', () => {
    const sitemapScript = read('scripts/generate_sitemaps.ts');

    expect(sitemapScript).toContain('const regulatoryEntries = ALL_STATES.map((state) =>');
    expect(sitemapScript).toContain('toStaticEntry(`${BASE_URL}/states/${state.slug}/regulations/`, 0.7)');
  });
});
