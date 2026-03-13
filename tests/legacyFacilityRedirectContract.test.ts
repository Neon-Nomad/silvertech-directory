import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('legacy facility redirect contract', () => {
  it('keeps /facility route rendering details directly (no unknown placeholder hop)', () => {
    const app = read('App.tsx');

    expect(app).toContain('<Route path="/facility/:id" element={<FacilityDetails />} />');
    expect(app).not.toContain('senior-living/unknown/unknown');
  });

  it('maps legacy /facility UUID redirects directly to canonical /senior-living URLs', () => {
    const redirects = read('public/_redirects');
    const legacyFacilityToFacility = redirects.match(/^\/facility\/.+ \/facility\/.+ 301$/gm) || [];
    const directFacilityToSeniorLiving = redirects.match(/^\/facility\/.+ \/senior-living\/.+\/ 301$/gm) || [];

    expect(legacyFacilityToFacility.length).toBe(0);
    expect(directFacilityToSeniorLiving.length).toBeGreaterThan(0);
  });
});

