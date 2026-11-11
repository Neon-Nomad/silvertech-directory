import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8').replace(/\r\n/g, '\n');

// Shared-layout links whose target pages do not exist yet. Each needs a product or legal decision before it
// can be fixed, so they are listed here instead of being silently allowed. This list may only shrink.
const KNOWN_UNRESOLVED_LINKS = new Set(['/privacy', '/terms']);

const appRouteSet = (): Set<string> => {
  const app = read('App.tsx');
  const routes = new Set<string>();
  for (const match of app.matchAll(/<Route\s+path="([^"*]+)"/g)) {
    routes.add(match[1].replace(/\/$/, '') || '/');
  }
  return routes;
};

const CARE_TYPE_SLUGS = [
  'assisted-living',
  'memory-care',
  'nursing-homes',
  'independent-living',
  'residential-care',
  'adult-day-services',
  'ccrc',
];

const astroPageExists = (href: string): boolean => {
  const clean = href.replace(/\/$/, '');
  if (clean === '') return existsSync(resolve(process.cwd(), 'astro-src/pages/index.astro'));
  if (CARE_TYPE_SLUGS.includes(clean.slice(1)) && existsSync(resolve(process.cwd(), 'astro-src/pages/[care]/index.astro'))) {
    return true;
  }
  return (
    existsSync(resolve(process.cwd(), `astro-src/pages${clean}.astro`)) ||
    existsSync(resolve(process.cwd(), `astro-src/pages${clean}/index.astro`))
  );
};

describe('indexing contract: homepage shell and canonicals', () => {
  it('the SPA shell does not declare a homepage canonical for every route', () => {
    expect(read('index.html')).not.toMatch(/rel="canonical"/);
  });

  it('the pricing route declares its own canonical', () => {
    expect(read('features/public/pricing/PricingPage.tsx')).toContain(
      'href="https://silvertechdirectory.com/pricing"',
    );
  });

  it('the homepage declares its own canonical', () => {
    expect(read('features/family/landing/Home.tsx')).toContain(
      'href="https://silvertechdirectory.com/"',
    );
  });
});

describe('indexing contract: unknown pages', () => {
  it('the not-found page is marked noindex', () => {
    const app = read('App.tsx');
    const start = app.indexOf('const NotFound');
    expect(start).toBeGreaterThan(-1);
    const block = app.slice(start, start + 800);
    expect(block).toContain('<meta name="robots" content="noindex, nofollow" />');
  });
});

describe('indexing contract: shared navigation targets exist', () => {
  it('every shared-layout link resolves to a real page or route, except the known open items', () => {
    const layout = read('astro-src/layouts/Base.astro');
    const routes = appRouteSet();
    const hrefs = [...new Set([...layout.matchAll(/<a\s[^>]*href="(\/[^"#?{}]*)"/g)].map((m) => m[1]))];
    const broken = hrefs.filter((href) => {
      if (href === '/') return false;
      const normalized = href.replace(/\/$/, '');
      if (KNOWN_UNRESOLVED_LINKS.has(href)) return false;
      return !astroPageExists(href) && !routes.has(normalized);
    });
    expect(broken).toEqual([]);
  });

  it('the known open items are still listed as open (so the allowlist is kept honest)', () => {
    const layout = read('astro-src/layouts/Base.astro');
    for (const href of KNOWN_UNRESOLVED_LINKS) {
      if (layout.includes(`href="${href}"`)) {
        expect(astroPageExists(href)).toBe(false);
      }
    }
  });

  it('the Resources navigation link points to the guides hub, not a missing route', () => {
    const layout = read('astro-src/layouts/Base.astro');
    expect(layout).toContain('<a href="/guides/">Resources</a>');
    expect(layout).not.toContain('href="/resources/"');
  });
});

describe('routing contract: unknown paths return a real 404', () => {
  const rules = read('public/_redirects').split('\n').filter((line) => line && !line.startsWith('#'));

  it('the final rule serves the app shell with a 404 status, and there is no 200 catch-all', () => {
    expect(rules[rules.length - 1]).toBe('/* /index.html 404');
    expect(rules).not.toContain('/* /index.html 200');
  });

  it('every public SPA route is served with 200 before the 404 fallback', () => {
    for (const route of ['/pricing', '/contact', '/for-facilities', '/login', '/search', '/products/:category', '/dashboard/:tab']) {
      expect(rules).toContain(`${route} /index.html 200`);
    }
  });

  it('care-type, retired and developer routes are not opened up to the SPA', () => {
    expect(rules.some((r) => r.startsWith('/:careType'))).toBe(false);
    expect(rules.some((r) => r.startsWith('/__integrity'))).toBe(false);
    expect(rules.some((r) => r.startsWith('/regulations/:state '))).toBe(false);
  });

  it('existing 410 and 301 rules still precede the SPA routes', () => {
    const firstSpa = rules.indexOf('/pricing /index.html 200');
    expect(rules.indexOf('/community/* /410.html 410!')).toBeLessThan(firstSpa);
    expect(rules.indexOf('/regulations/:state/:topic /regulations/:state/ 301!')).toBeLessThan(firstSpa);
  });

  it('the static 404 page does not redirect to the homepage or claim its canonical', () => {
    const page = read('public/404.html');
    expect(page).not.toContain('window.location.replace');
    expect(page).not.toContain('rel="canonical"');
    expect(page).toContain('noindex');
  });
});
