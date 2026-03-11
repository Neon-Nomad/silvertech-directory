import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('seo canonical contract', () => {
  it('keeps trailing-slash canonical URLs aligned for new senior-living state and care-city pages', () => {
    const stateTemplate = read('astro-src/pages/senior-living/[state]/index.astro');
    const careCityTemplate = read('astro-src/pages/senior-living/[state]/[city]/[care]/index.astro');

    expect(stateTemplate).toContain('const canonical = `https://silvertechdirectory.com/senior-living/${stateData.stateSlug}/`;');
    expect(careCityTemplate).toContain('const canonical = `https://silvertechdirectory.com/senior-living/${cityData.stateSlug}/${cityData.citySlug}/${careType.slug}/`;');
  });

  it('links to city and care pages using final trailing-slash URLs from templates', () => {
    const stateTemplate = read('astro-src/pages/senior-living/[state]/index.astro');
    const cityTemplate = read('astro-src/pages/senior-living/[state]/[city]/index.astro');

    expect(stateTemplate).toContain('href={`/senior-living/${city.stateSlug}/${city.citySlug}/`}');
    expect(cityTemplate).toContain('href={`/senior-living/${cityData.stateSlug}/${cityData.citySlug}/${care.slug}/`}');
  });

  it('emits trailing-slash final URLs in sitemap generation for facilities and senior-living pages', () => {
    const generator = read('scripts/generate_sitemaps.ts');

    expect(generator).toContain('getAllCityCareCombos');
    expect(generator).toContain('baseName: \'sitemap-care-type-cities\'');
    expect(generator).toContain('chunkSize: CARE_TYPE_CITY_CHUNK_SIZE');
    expect(generator).toContain('forceNumbered: true');
    expect(generator).toContain('priority: STATE_PAGE_PRIORITY');
    expect(generator).toContain('priority: CITY_PAGE_PRIORITY');
    expect(generator).toContain('priority: CARE_TYPE_CITY_PRIORITY');
    expect(generator).toContain('writeSitemapIndex(\'sitemap-index.xml\', sitemapFiles);');
  });
});
