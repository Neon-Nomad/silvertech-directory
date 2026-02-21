import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('seo canonical contract', () => {
  it('keeps trailing-slash canonical and og:url aligned on key assisted-living state pages', () => {
    const stateTemplate = read('features/locations/StatePageTemplate.tsx');
    const california = read('features/locations/CaliforniaPage.tsx');
    const indiana = read('features/locations/IndianaPage.tsx');

    expect(stateTemplate).toContain('<link rel="canonical" href={`https://silvertechdirectory.com/assisted-living/${stateDef.slug}/`} />');
    expect(stateTemplate).toContain('<meta property="og:url" content={`https://silvertechdirectory.com/assisted-living/${stateDef.slug}/`} />');

    expect(california).toContain('<link rel="canonical" href="https://silvertechdirectory.com/assisted-living/california/" />');
    expect(california).toContain('<meta property="og:url" content="https://silvertechdirectory.com/assisted-living/california/" />');

    expect(indiana).toContain('<link rel="canonical" href="https://silvertechdirectory.com/assisted-living/indiana/" />');
    expect(indiana).toContain('<meta property="og:url" content="https://silvertechdirectory.com/assisted-living/indiana/" />');
  });

  it('links to city pages using final trailing-slash URLs from state template', () => {
    const stateTemplate = read('features/locations/StatePageTemplate.tsx');

    expect(stateTemplate).toContain('to={`/assisted-living/${stateDef.slug}/cities/${city.slug}/`}');
  });

  it('emits trailing-slash final URLs in sitemap generation for facilities and assisted-living pages', () => {
    const generator = read('scripts/generate_sitemaps.ts');

    expect(generator).toContain('facilityUrls.push(`${BASE_URL}/facility/${facility.id}/`)');
    expect(generator).toContain('cityUrls.add(`${BASE_URL}/assisted-living/${stateDef.slug}/cities/${citySlug}/`)');
    expect(generator).toContain('stateUrls.push(`${BASE_URL}/assisted-living/${slug}/`)');
  });
});

