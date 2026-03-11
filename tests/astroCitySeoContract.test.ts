import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro city seo contract', () => {
  it('keeps care-city canonical URL slash-final and aligned', () => {
    const cityTemplate = read('astro-src/pages/senior-living/[state]/[city]/[care]/index.astro');

    expect(cityTemplate).toContain('const canonical = `https://silvertechdirectory.com/senior-living/${cityData.stateSlug}/${cityData.citySlug}/${careType.slug}/`;');
    expect(cityTemplate).toContain('<Base title={title} description={description} canonical={canonical}>');
  });

  it('emits required structured data blocks for care-city pages', () => {
    const cityTemplate = read('astro-src/pages/senior-living/[state]/[city]/[care]/index.astro');

    expect(cityTemplate).toContain("const webPageSchema = {");
    expect(cityTemplate).toContain("const itemListSchema = {");
    expect(cityTemplate).toContain("const breadcrumbSchema = {");
    expect(cityTemplate).toContain("const faqSchema = {");
    expect(cityTemplate).toContain('<script type="application/ld+json" set:html={JSON.stringify(faqSchema)}></script>');
  });

  it('contains crawlable facility links and care-type link mesh', () => {
    const cityTemplate = read('astro-src/pages/senior-living/[state]/[city]/[care]/index.astro');

    expect(cityTemplate).toContain('href={`/facility/${facility.id}/`}');
    expect(cityTemplate).toContain('href={`/senior-living/${cityData.stateSlug}/${cityData.citySlug}/${care.slug}/`}');
    expect(cityTemplate).toContain('href={`/senior-living/${cityData.stateSlug}/${cityData.citySlug}/`}');
  });

  it('contains care-specific regulatory and nearby-city navigation blocks', () => {
    const cityTemplate = read('astro-src/pages/senior-living/[state]/[city]/[care]/index.astro');

    expect(cityTemplate).toContain('Regulatory Compliance Context');
    expect(cityTemplate).toContain('Understanding {cityData.stateName} {careType.label} Regulations');
    expect(cityTemplate).toContain('Explore {careType.label} in Nearby Cities');
  });
});
