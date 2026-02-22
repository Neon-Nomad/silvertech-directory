import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro state seo contract', () => {
  it('keeps state canonical URL slash-final and aligned', () => {
    const stateTemplate = read('astro-src/pages/assisted-living/[state]/index.astro');

    expect(stateTemplate).toContain('const canonical = `https://silvertechdirectory.com/assisted-living/${stateSlug}/`;');
    expect(stateTemplate).toContain('<Base title={title} description={description} canonical={canonical}>');
  });

  it('emits required structured data blocks for state pages', () => {
    const stateTemplate = read('astro-src/pages/assisted-living/[state]/index.astro');

    expect(stateTemplate).toContain('const webPageSchema = {');
    expect(stateTemplate).toContain('const breadcrumbSchema = {');
    expect(stateTemplate).toContain('const cityListSchema = {');
    expect(stateTemplate).toContain('const faqSchema = {');
    expect(stateTemplate).toContain('<script type="application/ld+json" set:html={JSON.stringify(faqSchema)}></script>');
  });

  it('contains crawlable city links and state resource links', () => {
    const stateTemplate = read('astro-src/pages/assisted-living/[state]/index.astro');

    expect(stateTemplate).toContain('href={`/assisted-living/${city.stateSlug}/cities/${city.citySlug}/`}');
    expect(stateTemplate).toContain('href={`/states/${stateSlug}/regulations`}');
    expect(stateTemplate).toContain('href={`/states/${stateSlug}/medicaid`}');
  });

  it('integrates emotional family guidance links from state pages to guide cluster', () => {
    const stateTemplate = read('astro-src/pages/assisted-living/[state]/index.astro');

    expect(stateTemplate).toContain('const emotionalGuideLinks = [');
    expect(stateTemplate).toContain('Emotional &amp; Family Guidance');
    expect(stateTemplate).toContain("href: '/guides/guilt-about-placing-parent-in-memory-care/'");
    expect(stateTemplate).toContain("href: '/guides/caregiver-at-breaking-point/'");
    expect(stateTemplate).toContain("href: '/guides/sibling-not-helping-parent-care/'");
  });
});
