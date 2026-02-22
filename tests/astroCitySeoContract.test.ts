import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro city seo contract', () => {
  it('keeps city canonical URL slash-final and aligned', () => {
    const cityTemplate = read('astro-src/pages/assisted-living/[state]/cities/[city].astro');

    expect(cityTemplate).toContain('const canonical = `https://silvertechdirectory.com/assisted-living/${stateSlug}/cities/${citySlug}/`;');
    expect(cityTemplate).toContain('<Base title={title} description={description} canonical={canonical}>');
  });

  it('emits required structured data blocks for city pages', () => {
    const cityTemplate = read('astro-src/pages/assisted-living/[state]/cities/[city].astro');

    expect(cityTemplate).toContain("const webPageSchema = {");
    expect(cityTemplate).toContain("const itemListSchema = {");
    expect(cityTemplate).toContain("const breadcrumbSchema = {");
    expect(cityTemplate).toContain("const faqSchema = {");
    expect(cityTemplate).toContain('<script type="application/ld+json" set:html={JSON.stringify(faqSchema)}></script>');
  });

  it('contains crawlable facility links and sponsored dining labeling support', () => {
    const cityTemplate = read('astro-src/pages/assisted-living/[state]/cities/[city].astro');

    expect(cityTemplate).toContain('href={`/facility/${facility.id}/`}');
    expect(cityTemplate).toContain("const curatedDiningByCity: Record<string, DiningSpot[]> = {");
    expect(cityTemplate).toContain('{spot.sponsored && <span class="sponsored-pill">Sponsored</span>}');
  });

  it('adds conditional decision-making guide links for memory-care-heavy cities', () => {
    const cityTemplate = read('astro-src/pages/assisted-living/[state]/cities/[city].astro');

    expect(cityTemplate).toContain('const isMemoryCareFacility = (facility: { name?: string; facility_type?: string }) => {');
    expect(cityTemplate).toContain('const shouldShowDecisionGuides = memoryCareFacilityCount >= 3;');
    expect(cityTemplate).toContain('Supporting Families Through Decision-Making');
    expect(cityTemplate).toContain("href: '/guides/guilt-about-placing-parent-in-memory-care/'");
    expect(cityTemplate).toContain("href: '/guides/caregiver-at-breaking-point/'");
  });
});
