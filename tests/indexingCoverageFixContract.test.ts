import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('indexing coverage fix contract', () => {
  it('keeps host canonical redirects and retires legacy public directory URLs with 410', () => {
    const netlifyConfig = read('netlify.toml');

    expect(netlifyConfig).toContain('from = "http://www.silvertechdirectory.com/*"');
    expect(netlifyConfig).toContain('from = "http://silvertechdirectory.com/*"');
    expect(netlifyConfig).toContain('from = "/facility/*"');
    expect(netlifyConfig).toContain('from = "/regulatory-library"');
    expect(netlifyConfig).toContain('from = "/assisted-living/:state/cities/:city"');
    expect(netlifyConfig).toContain('status = 410');
    expect(netlifyConfig).toContain('to = "/410.html"');
  });

  it('keeps generated _redirects aligned to canonical host and retirement rules', () => {
    const redirectsGenerator = read('scripts/generate_redirects.ts');

    expect(redirectsGenerator).toContain('http://www.silvertechdirectory.com/* https://silvertechdirectory.com/:splat 301!');
    expect(redirectsGenerator).toContain('/facility/* /410.html 410!');
    expect(redirectsGenerator).toContain('/senior-living/* /410.html 410!');
    expect(redirectsGenerator).toContain('/states/:state/regulations/* /410.html 410!');
    expect(redirectsGenerator).toContain('/regulatory-library /410.html 410!');
    expect(redirectsGenerator).not.toContain('/senior-living/:state/:city/');
  });

  it('ships static states, regulations, and care-type pages into dist during hybrid merge', () => {
    const mergeScript = read('scripts/merge_astro.mjs');

    expect(mergeScript).toContain("const topLevelAstroRouteDirs = [");
    expect(mergeScript).toContain("'states'");
    expect(mergeScript).toContain("'regulations'");
    expect(mergeScript).toContain("src: path.join(astroRoot, dir)");
    expect(mergeScript).toContain("dest: path.join(root, 'dist', dir)");
    expect(mergeScript).toContain("'assisted-living'");
  });

  it('provides an indexable static regulations page under /regulations/:state', () => {
    const regulationsTemplate = read('astro-src/pages/regulations/[state]/index.astro');

    expect(regulationsTemplate).toContain('export async function getStaticPaths()');
    expect(regulationsTemplate).toContain('const canonical = `https://silvertechdirectory.com/regulations/${stateMeta.slug}/`;');
    expect(regulationsTemplate).toContain('<h1 class="sl-state-hero-title">');
    expect(regulationsTemplate).toContain('<span>{stateMeta.name} </span>');
    expect(regulationsTemplate).toContain('<span class="sl-state-hero-accent">Regulations</span>');
  });

  it('includes regulations and care-type URLs in generated sitemaps', () => {
    const sitemapScript = read('scripts/generate_sitemaps.ts');

    expect(sitemapScript).toContain("const LEGACY_SITEMAP_FILES = ['sitemap-cities.xml', 'sitemap-states.xml'];");
    expect(sitemapScript).toContain('const regulatoryEntries = ALL_STATES.flatMap((state) => [');
    expect(sitemapScript).toContain('toStaticEntry(`${BASE_URL}/regulations/${state.slug}/`, 0.7)');
    expect(sitemapScript).toContain('const careTypeStateEntries = uniqueEntries(');
  });

  it('fails verification if stale legacy sitemap files are still present', () => {
    const sitemapVerifyScript = read('scripts/verify_sitemap.ts');

    expect(sitemapVerifyScript).toContain("const legacySitemapFiles = ['sitemap-cities.xml'];");
    expect(sitemapVerifyScript).toContain('Stale legacy sitemap files:');
  });

  it('removes legacy astro source routes that no longer belong in the public surface', () => {
    expect(existsSync(resolve(process.cwd(), 'astro-src/pages/senior-living/index.astro'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'astro-src/pages/senior-living/[state]/index.astro'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'astro-src/pages/senior-living/[state]/[city]/index.astro'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'astro-src/pages/senior-living/[state]/[city]/[care]/index.astro'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'astro-src/pages/states/[state]/regulations/index.astro'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'features/locations/CaliforniaPage.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'features/locations/IndianaPage.tsx'))).toBe(false);
    expect(existsSync(resolve(process.cwd(), 'src/data/state_content.ts'))).toBe(false);
  });
});
