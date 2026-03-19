import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const FACILITY_TEMPLATE = 'astro-src/pages/[care]/[state]/[city]/[facilitySlug].astro';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

const stripFrontmatter = (source: string) => source.replace(/^---[\s\S]*?---/, '');

const extractReadableText = (source: string) => {
  let text = stripFrontmatter(source);

  text = text.replace(/<script[\s\S]*?<\/script>/gi, ' ');

  let previous = '';
  while (previous !== text) {
    previous = text;
    text = text.replace(/\{[^{}]*\}/g, ' ');
  }

  text = text.replace(/<[^>]+>/g, ' ');
  text = text.replace(/&[a-z]+;/gi, ' ');
  text = text.replace(/[^A-Za-z0-9# ]+/g, ' ');
  text = text.replace(/\s+/g, ' ').trim();

  return text;
};

describe('seo quality sledgehammer contract', () => {
  it('enforces facility content density and trust-signal floor for SEO', () => {
    const facilityTemplate = read(FACILITY_TEMPLATE);
    const textContent = extractReadableText(facilityTemplate);
    const wordCount = textContent.split(' ').filter(Boolean).length;

    expect(wordCount).toBeGreaterThanOrEqual(250);
    expect(facilityTemplate).toContain('Verified Identifiers');
    expect(facilityTemplate).toContain('State License');
    expect(facilityTemplate).toContain('Regulatory Hub');
    expect(facilityTemplate).toContain(
      'Regulatory data sourced from state licensing agencies and CMS public records. Data is refreshed periodically.',
    );
  });

  it('keeps semantic depth with one H1 and durable H2 section coverage', () => {
    const facilityTemplate = read(FACILITY_TEMPLATE);
    const h1Count = (facilityTemplate.match(/<h1\b/gi) || []).length;
    const h2Count = (facilityTemplate.match(/<h2\b/gi) || []).length;

    expect(h1Count).toBe(1);
    expect(facilityTemplate).toContain('<h1 class="fp-hero-title">{displayName}</h1>');
    expect(h2Count).toBeGreaterThanOrEqual(6);
    expect(facilityTemplate).toContain('Verified Identifiers');
    expect(facilityTemplate).toContain('Facility Profile');
    expect(facilityTemplate).toContain('Regulatory Hub');
    expect(facilityTemplate).toContain('Schedule a Tour');
    expect(facilityTemplate).toContain('Community Q&amp;A');
    expect(facilityTemplate).toContain('Explore {careLabel}');
  });

  it('keeps facility-to-city-and-state internal link mesh intact', () => {
    const facilityTemplate = read(FACILITY_TEMPLATE);

    expect(facilityTemplate).toContain('const cityPageUrl  = `/${care}/${state}/${city}/`;');
    expect(facilityTemplate).toContain('const carePageUrl  = `/${care}/${state}/`;');
    expect(facilityTemplate).toContain('<a href={`/${care}/`}>{careLabel}</a>');
    expect(facilityTemplate).toContain('<a href={carePageUrl}>{facility.stateName}</a>');
    expect(facilityTemplate).toContain('<a href={cityPageUrl}>{displayCity}</a>');
    expect(facilityTemplate).toContain('<a href={cityPageUrl} class="fp-btn fp-btn-outline">');
    expect(facilityTemplate).toContain('<a href={carePageUrl} style="color:#ca8a04');
  });

  it('requires alt text for any future img tags in facility template', () => {
    const facilityTemplate = read(FACILITY_TEMPLATE);
    const imgTags = facilityTemplate.match(/<img\b[^>]*>/gi) || [];
    const missingAlt = imgTags.filter((imgTag) => !/\balt\s*=\s*(['"]).*?\1/i.test(imgTag));

    expect(missingAlt).toHaveLength(0);
  });
});
