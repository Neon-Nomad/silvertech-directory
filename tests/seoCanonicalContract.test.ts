import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n');

describe('seo canonical contract', () => {
  it('keeps trailing-slash canonical URLs aligned for care-type state and city pages', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(stateTemplate).toContain('const canonical = `https://silvertechdirectory.com/${careType.slug}/${stateData.stateSlug}/`;');
    expect(cityTemplate).toContain('const canonical = `https://silvertechdirectory.com/${careType.slug}/${cityData.stateSlug}/${cityData.citySlug}/`;');
  });

  it('links to city and facility pages using final trailing-slash URLs from templates', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(stateTemplate).toContain('href={`/${careType.slug}/${stateData.stateSlug}/${city.citySlug}/`}');
    expect(cityTemplate).toContain('const getFacilityProfileHref = (facility: (typeof facilities)[number]): string =>');
    expect(cityTemplate).toContain('`/${facility.primaryCareType}/${facility.stateSlug}/${facility.citySlug}/${facility.publicSlug}-${facility.publicRouteId}/`;');
    expect(cityTemplate).toContain('href={getFacilityProfileHref(facility)}');
  });

  it('emits trailing-slash final URLs in sitemap generation for care-type, facility, and regulations pages', () => {
    const generator = read('scripts/generate_sitemaps.ts');

    expect(generator).toContain('url: `${BASE_URL}/${routePath.care}/${routePath.state}/${routePath.city}/${routePath.facilitySlug}/`');
    expect(generator).toContain('toStaticEntry(`${BASE_URL}/regulations/${state.slug}/`, 0.7)');
    expect(generator).toContain('url: `${BASE_URL}/${careTypeSlug}/${state.stateSlug}/`');
    expect(generator).toContain('url: `${BASE_URL}/${routePath.care}/${routePath.state}/${routePath.city}/`');
    expect(generator).toContain('writeSitemapIndex(\'sitemap-index.xml\', sitemapFiles);');
  });
});
