import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro state seo contract', () => {
  it('keeps state canonical URL slash-final and aligned', () => {
    const stateTemplate = read('astro-src/pages/senior-living/[state]/index.astro');

    expect(stateTemplate).toContain('const canonical = `https://silvertechdirectory.com/senior-living/${stateData.stateSlug}/`;');
    expect(stateTemplate).toContain('<Base title={title} description={description} canonical={canonical}>');
  });

  it('emits required structured data blocks for state pages', () => {
    const stateTemplate = read('astro-src/pages/senior-living/[state]/index.astro');

    expect(stateTemplate).toContain('const webPageSchema = {');
    expect(stateTemplate).toContain('const breadcrumbSchema = {');
    expect(stateTemplate).toContain('const cityListSchema = {');
    expect(stateTemplate).toContain('const faqSchema = {');
    expect(stateTemplate).toContain('<script type="application/ld+json" set:html={JSON.stringify(faqSchema)}></script>');
  });

  it('contains crawlable city links and state resource links', () => {
    const stateTemplate = read('astro-src/pages/senior-living/[state]/index.astro');

    expect(stateTemplate).toContain('href={`/senior-living/${city.stateSlug}/${city.citySlug}/`}');
    expect(stateTemplate).toContain('href={`/states/${stateData.stateSlug}/regulations`}');
    expect(stateTemplate).toContain('href={`/states/${stateData.stateSlug}/medicaid`}');
  });

  it('integrates statewide trust and care guidance sections', () => {
    const stateTemplate = read('astro-src/pages/senior-living/[state]/index.astro');

    expect(stateTemplate).toContain('Statewide Cost Overview');
    expect(stateTemplate).toContain('Licensing and Public Assistance Infrastructure');
    expect(stateTemplate).toContain('State Resources');
  });
});
