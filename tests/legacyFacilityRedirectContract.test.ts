import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('legacy facility redirect contract', () => {
  it('renders canonical facility details at /community and retires /facility', () => {
    const app = read('App.tsx');

    expect(app).toContain('<Route path="/community/:communityId" element={<FacilityDetails />} />');
    expect(app).toContain('<Route path="/facility/:id" element={<LegacyRouteRetired />} />');
    expect(app).toContain('<Route path="/regulatory-library/*" element={<LegacyRouteRetired />} />');
  });

  it('retires legacy /facility URLs with 410 instead of redirects', () => {
    const redirects = read('public/_redirects');
    const legacyFacilityRedirects = redirects.match(/^\/facility\/.+ 301/gm) || [];

    expect(redirects).toContain('/facility/* /410.html 410!');
    expect(redirects).toContain('/regulatory-library /410.html 410!');
    expect(legacyFacilityRedirects.length).toBe(0);
  });
});
