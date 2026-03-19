import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro city seo contract', () => {
  it('keeps care-city canonical URL slash-final and aligned', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('const canonical = `https://silvertechdirectory.com/${careType.slug}/${cityData.stateSlug}/${cityData.citySlug}/`;');
    expect(cityTemplate).toContain('<Base title={title} description={description} canonical={canonical} loadFonts={false}>');
    expect(cityTemplate).toContain('const displayCityName = toDisplayName(cityData.cityName);');
    expect(cityTemplate).toContain('const description = `Compare ${careInventoryLabel} in ${displayCityName}, ${cityData.stateName}. Review license numbers, Medicare-linked records, hospitals, and state oversight on SilverTech.`;');
  });

  it('emits breadcrumb and item-list structured data for care-city pages', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('const breadcrumbSchema = {');
    expect(cityTemplate).toContain('const itemListSchema = {');
    expect(cityTemplate).toContain('<script slot="head" type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)}></script>');
    expect(cityTemplate).toContain('<script slot="head" type="application/ld+json" set:html={JSON.stringify(itemListSchema)}></script>');
  });

  it('contains crawlable facility links and route-family navigation', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('href={`/${careType.slug}/${cityData.stateSlug}/${cityData.citySlug}/${facility.publicSlug}-${facility.publicRouteId}/`}');
    expect(cityTemplate).toContain('href={`/regulations/${cityData.stateSlug}/`}');
    expect(cityTemplate).toContain('href={`/${careType.slug}/${cityData.stateSlug}/`}');
    expect(cityTemplate).toContain('name: toDisplayName(facility.name),');
    expect(cityTemplate).toContain('{toDisplayName(facility.name)}');
    expect(cityTemplate).toContain('const formatPhoneDisplay = (value: string): string => {');
    expect(cityTemplate).toContain('{formatPhoneDisplay(facility.verifiedPhone || facility.phone)}');
    expect(cityTemplate).toContain('const formatOwnershipLabel = (value: string): string => {');
    expect(cityTemplate).toContain('{formatOwnershipLabel(facility.ownershipType)}');
  });

  it('contains the editorial city template sections for the new clean route family', () => {
    const cityTemplate = read('astro-src/pages/[care]/[state]/[city]/index.astro');

    expect(cityTemplate).toContain('Verified Listings');
    expect(cityTemplate).toContain('Nearby hospital context');
    expect(cityTemplate).toContain('Regulations and Oversight');
    expect(cityTemplate).toContain('Expert Support');
    expect(cityTemplate).toContain('stable public URLs');
  });
});
