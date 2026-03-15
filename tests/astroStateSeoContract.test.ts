import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro state seo contract', () => {
  it('keeps care-type state canonical URL slash-final and aligned', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');

    expect(stateTemplate).toContain('const canonical = `https://silvertechdirectory.com/${careType.slug}/${stateData.stateSlug}/`;');
    expect(stateTemplate).toContain('<Base title={title} description={description} canonical={canonical}>');
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
  });

  it('surfaces the new state directory framing', () => {
    const stateTemplate = read('astro-src/pages/[care]/[state]/index.astro');

    expect(stateTemplate).toContain('State Directory');
    expect(stateTemplate).toContain('Top Cities in {stateData.stateName}');
    expect(stateTemplate).toContain('Browse city-level {careType.label.toLowerCase()} pages');
  });
});
