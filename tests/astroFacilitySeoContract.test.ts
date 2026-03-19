import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro facility seo contract', () => {
  it('removes the deprecated static /facility route template', () => {
    const facilityTemplatePath = resolve(process.cwd(), 'astro-src/pages/facility/[id].astro');

    expect(existsSync(facilityTemplatePath)).toBe(false);
  });

  it('keeps facility URL generation anchored to Astro care/state/city/slug-id paths', () => {
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
    expect(facilityPathHelper).toContain("if (!careTypeSlug || !CARE_TYPE_ROUTE_SLUGS.has(careTypeSlug) || !stateSlug || !citySlug) {");
    expect(hasSearchFallbackId).toBe(true);
    expect(facilityPathHelper).toMatch(/const (COMMUNITY|FACILITY)_ID_PATTERN =/);
    expect(facilityPathHelper).not.toMatch(/export const parse(Community|Facility)Id/);
    expect(facilityPathHelper).not.toContain('/community/${');
  });
});
