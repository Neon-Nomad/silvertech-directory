import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro internal link mesh contract', () => {
  it('ensures city templates link facilities via canonical facility helper paths', () => {
    const cityTemplate = read('features/locations/CityPageTemplate.tsx');

    expect(cityTemplate).toContain('buildFacilityDetailPath({');
    expect(cityTemplate).toContain('publicSlug: facility.public_slug');
    expect(cityTemplate).toContain('publicRouteId: facility.public_route_id');
    expect(cityTemplate).toContain('buildRegulationsPath(stateDef.slug)');
  });

  it('ensures guide pages include shared geo backlinks to clean care-type hubs', () => {
    const guideLayout = read('astro-src/components/GuideArticle.astro');

    expect(guideLayout).toContain('const topCityGeoLinks: LinkItem[] = [');
    expect(guideLayout).toContain("href: '/memory-care/california/san-francisco/'");
    expect(guideLayout).toContain("href: '/assisted-living/florida/saint-petersburg/'");
    expect(guideLayout).toContain("href: '/assisted-living/oklahoma/oklahoma-city/'");
    expect(guideLayout).toContain('Top City Care Hubs');
    expect(guideLayout).toContain('{topCityGeoLinks.map((link) => (');
  });
});
