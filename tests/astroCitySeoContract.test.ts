import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro city seo contract', () => {
  it('keeps care-city canonical URL slash-final and aligned', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('const canonical = `https://silvertechdirectory.com/${careType.slug}/${cityData.stateSlug}/${cityData.citySlug}/`;');
    expect(cityTemplate).toContain('<Base title={title} description={description} canonical={canonical}>');
  });

  it('emits breadcrumb and item-list structured data for care-city pages', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('const breadcrumbSchema = {');
    expect(cityTemplate).toContain('const itemListSchema = {');
    expect(cityTemplate).toContain('<script slot="head" type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)}></script>');
    expect(cityTemplate).toContain('<script slot="head" type="application/ld+json" set:html={JSON.stringify(itemListSchema)}></script>');
  });

  it('contains crawlable community links and route-family navigation', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('href={`/community/${facility.publicSlug}-${facility.publicRouteId}/`}');
    expect(cityTemplate).toContain('href={`/regulations/${cityData.stateSlug}/`}');
    expect(cityTemplate).toContain('href={`/${careType.slug}/${cityData.stateSlug}/`}');
  });

  it('contains city directory content for the new clean route family', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('City Directory');
    expect(cityTemplate).toContain('Community Listings');
    expect(cityTemplate).toContain('canonical community profiles');
  });
});
