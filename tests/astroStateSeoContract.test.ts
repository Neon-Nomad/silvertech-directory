import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro state seo contract', () => {
  it('keeps care-type state canonical URL slash-final and aligned', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');

    expect(stateTemplate).toContain('const canonical = `https://silvertechdirectory.com/${careType.slug}/${stateData.stateSlug}/`;');
    expect(stateTemplate).toContain('<Base title={title} description={description} canonical={canonical}>');
    expect(stateTemplate).toContain('const description = `Compare ${formatCountLabel(scopedFacilities.length, careUnitSingular, careUnitPlural)} across ${formatCountLabel(activeCities.length, cityUnitSingular, cityUnitPlural)} in ${stateData.stateName}. Explore top city directories, regulations, Medicaid, ombudsman, and trust signals on SilverTech.`;');
  });

  it('emits breadcrumb and item-list structured data for state pages', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');

    expect(stateTemplate).toContain('const breadcrumbSchema = {');
    expect(stateTemplate).toContain('const itemListSchema = {');
    expect(stateTemplate).toContain('<script slot="head" type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)}></script>');
    expect(stateTemplate).toContain('<script slot="head" type="application/ld+json" set:html={JSON.stringify(itemListSchema)}></script>');
  });

  it('contains crawlable city links and regulations links', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');

    expect(stateTemplate).toContain('href={`/${careType.slug}/${stateData.stateSlug}/${city.citySlug}/`}');
    expect(stateTemplate).toContain('href={`/regulations/${stateData.stateSlug}/`}');
    expect(stateTemplate).toContain('href="#state-top-hubs"');
    expect(stateTemplate).toContain('href="#state-additional-markets"');
  });

  it('surfaces the new state directory framing', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');

    expect(stateTemplate).toContain('Official {currentYear} Statewide Directory');
    expect(stateTemplate).toContain('Top Care Hubs');
    expect(stateTemplate).toContain('The Gold Standard of Comparison');
    expect(stateTemplate).toContain('Official {stateData.stateName} Care Resource Network');
  });

  it('guards singular and zero-data statewide copy branches', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');

    expect(stateTemplate).toContain("const topHubSentence =");
    expect(stateTemplate).toContain("topHubNames.length === 1");
    expect(stateTemplate).toContain("Medicare-linked records are still limited in the current public dataset");
    expect(stateTemplate).toContain("License coverage is still limited in the current public dataset");
    expect(stateTemplate).toContain("Official website coverage is still limited in the current public dataset");
  });
});
