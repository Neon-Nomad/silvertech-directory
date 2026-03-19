import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('legacy facility redirect contract', () => {
  it('retires /community and /facility routes in React and leaves canonical facility pages to Astro', () => {
    const app = read('App.tsx');
    const hasLegacyCommunityRoute =
      app.includes('<Route path="/community/:communityId" element={<LegacyRouteRetired />} />') ||
      app.includes('<Route path="/community/:facilityId" element={<LegacyRouteRetired />} />');

    expect(hasLegacyCommunityRoute).toBe(true);
    expect(app).toContain('<Route path="/facility/:id" element={<LegacyRouteRetired />} />');
    expect(app).toContain('<Route path="/:careType/:state/:city/:facilitySlug" element={<AstroRoute />} />');
    expect(app).toContain('<Route path="/regulatory-library/*" element={<LegacyRouteRetired />} />');
  });

  it('builds canonical detail URLs with care/state/city/slug-id and no /community fallback', () => {
    const facilityPathHelper = read('src/utils/facilityPath.ts');
    const hasFacilityPathId =
      facilityPathHelper.includes(
        "return `/${careTypeSlug}/${stateSlug}/${citySlug}/${encodeURIComponent(communityId)}/`;",
      ) ||
      facilityPathHelper.includes(
        "return `/${careTypeSlug}/${stateSlug}/${citySlug}/${encodeURIComponent(facilityId)}/`;",
      );
    const hasSearchFallbackId =
      facilityPathHelper.includes("if (!communityId) return '/search';") ||
      facilityPathHelper.includes("if (!facilityId) return '/search';");

    expect(hasFacilityPathId).toBe(true);
    expect(hasSearchFallbackId).toBe(true);
    expect(facilityPathHelper).not.toMatch(/export const parse(Community|Facility)Id/);
    expect(facilityPathHelper).not.toContain('/community/${');
  });

  it('removes legacy /community edge metadata hydration and keeps route retired at the edge', () => {
    const netlifyConfig = read('netlify.toml');

    expect(netlifyConfig).toContain('from = "/community/*"');
    expect(netlifyConfig).toContain('status = 410');
    expect(netlifyConfig).toContain('to = "/410.html"');
    expect(existsSync(resolve(process.cwd(), 'netlify/edge-functions/facility-metadata.ts'))).toBe(false);
    expect(netlifyConfig).not.toContain('facility-metadata');
  });

  it('retires legacy /facility URLs with 410 instead of redirects', () => {
    const redirects = read('public/_redirects');
    const legacyFacilityRedirects = redirects.match(/^\/facility\/.+ 301/gm) || [];

    expect(redirects).toContain('/facility/* /410.html 410!');
    expect(redirects).toContain('/regulatory-library /410.html 410!');
    expect(legacyFacilityRedirects.length).toBe(0);
  });
});
