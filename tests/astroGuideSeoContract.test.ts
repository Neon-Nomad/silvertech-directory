import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

const guideContracts = [
  {
    file: 'astro-src/pages/guides/hidden-costs-of-memory-care.astro',
    canonical: "const canonical = 'https://silvertechdirectory.com/guides/hidden-costs-of-memory-care/';",
    h1: 'Hidden Costs of Memory Care: What Families Are Never Told Up Front'
  },
  {
    file: 'astro-src/pages/guides/guilt-about-placing-parent-in-memory-care.astro',
    canonical: "const canonical = 'https://silvertechdirectory.com/guides/guilt-about-placing-parent-in-memory-care/';",
    h1: 'Guilt About Placing a Parent in Memory Care: What That Feeling Really Means'
  },
  {
    file: 'astro-src/pages/guides/grief-while-parent-is-still-alive-dementia.astro',
    canonical: "const canonical = 'https://silvertechdirectory.com/guides/grief-while-parent-is-still-alive-dementia/';",
    h1: 'Grief While Parent Is Still Alive With Dementia: Understanding Ambiguous Loss'
  },
  {
    file: 'astro-src/pages/guides/caregiver-resentment-toward-parent.astro',
    canonical: "const canonical = 'https://silvertechdirectory.com/guides/caregiver-resentment-toward-parent/';",
    h1: 'Caregiver Resentment Toward Parent: A Real and Common Dementia Care Signal'
  },
  {
    file: 'astro-src/pages/guides/sibling-not-helping-parent-care.astro',
    canonical: "const canonical = 'https://silvertechdirectory.com/guides/sibling-not-helping-parent-care/';",
    h1: 'Sibling Not Helping With Parent Care: How To Move From Anger To Action'
  },
  {
    file: 'astro-src/pages/guides/caregiver-at-breaking-point.astro',
    canonical: "const canonical = 'https://silvertechdirectory.com/guides/caregiver-at-breaking-point/';",
    h1: 'I Cannot Do This Anymore Caring for My Parent: What To Do at the Breaking Point'
  }
];

describe('astro guide seo contract', () => {
  it('keeps slash-final canonical and article metadata aligned for each guide', () => {
    for (const guide of guideContracts) {
      const template = read(guide.file);
      expect(template).toContain(guide.canonical);
      expect(template).toContain('published={published}');
      expect(template).toContain('modified={modified}');
    }
  });

  it('emits structured data blocks for each guide page', () => {
    for (const guide of guideContracts) {
      const template = read(guide.file);
      expect(template).toContain('const breadcrumbSchema = {');
      expect(template).toContain('const articleSchema = {');
      expect(template).toContain('const faqSchema = {');
      expect(template).toContain('<script slot="head" type="application/ld+json" set:html={JSON.stringify(faqSchema)}></script>');
    }
  });

  it('keeps single keyword-targeted h1 values for each guide', () => {
    for (const guide of guideContracts) {
      const template = read(guide.file);
      expect(template).toContain(`const h1 = '${guide.h1}';`);
      expect(template).toContain('faqItems=');
    }
  });

  it('keeps guide index links aligned to live guide slugs', () => {
    const index = read('astro-src/pages/guides/index.astro');

    expect(index).toContain("href: '/guides/hidden-costs-of-memory-care/'");
    expect(index).toContain("href: '/guides/guilt-about-placing-parent-in-memory-care/'");
    expect(index).toContain("href: '/guides/grief-while-parent-is-still-alive-dementia/'");
    expect(index).toContain("href: '/guides/caregiver-resentment-toward-parent/'");
    expect(index).toContain("href: '/guides/sibling-not-helping-parent-care/'");
    expect(index).toContain("href: '/guides/caregiver-at-breaking-point/'");
  });
});
