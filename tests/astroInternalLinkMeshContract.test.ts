import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro internal link mesh contract', () => {
  it('ensures facility pages include a persistent guide and licensing link mesh', () => {
    const facilityTemplate = read('astro-src/pages/facility/[id].astro');

    expect(facilityTemplate).toContain('const primaryGuideLink = isMemoryCareTagged');
    expect(facilityTemplate).toContain('const secondaryGuideLink = isMemoryCareTagged');
    expect(facilityTemplate).toContain('Planning and Licensing Links');
    expect(facilityTemplate).toContain('Understanding {stateName} licensing and oversight requirements');
    expect(facilityTemplate).toContain('href={primaryGuideLink.href}');
    expect(facilityTemplate).toContain('href={secondaryGuideLink.href}');
    expect(facilityTemplate).toContain('Senior care in {facility.city}, {facility.state}');
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
