import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro facility seo contract', () => {
  it('removes the deprecated static /facility route template', () => {
    const facilityTemplatePath = resolve(process.cwd(), 'astro-src/pages/facility/[id].astro');

    expect(existsSync(facilityTemplatePath)).toBe(false);
  });

  it('keeps facility URL generation anchored to /senior-living hierarchy', () => {
    const facilityPathHelper = read('src/utils/facilityPath.ts');

    expect(facilityPathHelper).toContain('return `/senior-living/${stateSlug}/${citySlug}/${encodedId}/`;');
    expect(facilityPathHelper).not.toContain('return `/facility/${encodedId}`;');
  });
});
