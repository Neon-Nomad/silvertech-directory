import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro internal link mesh contract', () => {
  it('ensures city templates link facilities via hierarchical helper paths', () => {
    const cityTemplate = read('features/locations/CityPageTemplate.tsx');

    expect(cityTemplate).toContain("import { buildFacilityDetailPath, isCareTypeRouteSlug } from '@/src/utils/facilityPath';");
    expect(cityTemplate).toContain('to={buildFacilityDetailPath({ id: facility.id, state: facility.state, city: facility.city })}');
    expect(cityTemplate).toContain('url: `https://silvertechdirectory.com${buildFacilityDetailPath({ id: f.id, state: f.state, city: f.city })}`,');
  });

  it('ensures guide pages include shared geo backlinks to city hubs', () => {
    const guideLayout = read('astro-src/components/GuideArticle.astro');

    expect(guideLayout).toContain('const topCityGeoLinks: LinkItem[] = [');
    expect(guideLayout).toContain("href: '/senior-living/california/san-francisco/memory-care/'");
    expect(guideLayout).toContain("href: '/senior-living/florida/saint-petersburg/'");
    expect(guideLayout).toContain("href: '/senior-living/oklahoma/oklahoma-city/'");
    expect(guideLayout).toContain('Top City Care Hubs');
    expect(guideLayout).toContain('{topCityGeoLinks.map((link) => (');
  });
});
