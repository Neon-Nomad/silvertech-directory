import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('astro facility seo contract', () => {
  it('keeps slash-final canonical URL and facility schema wiring', () => {
    const facilityTemplate = read('astro-src/pages/facility/[id].astro');

    expect(facilityTemplate).toContain('const canonical = `https://silvertechdirectory.com/facility/${facility.id}/`;');
    expect(facilityTemplate).toContain('<script type="application/ld+json" set:html={JSON.stringify(schema)}></script>');
    expect(facilityTemplate).toContain('<script type="application/ld+json" set:html={JSON.stringify(breadcrumbSchema)}></script>');
  });

  it('adds a single memory-care-context guide link on tagged facility pages', () => {
    const facilityTemplate = read('astro-src/pages/facility/[id].astro');

    expect(facilityTemplate).toContain('const isMemoryCareTagged = /memory|dementia|alzheimer/.test(facilityDescriptor);');
    expect(facilityTemplate).toContain("href: '/guides/guilt-about-placing-parent-in-memory-care/'");
    expect(facilityTemplate).toContain('Families navigating difficult memory care decisions may find this helpful:');
  });
});
