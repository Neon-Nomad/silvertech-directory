import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildHeaders, inlineHandlers, inlineScriptHashes, PLACEHOLDER } from '../scripts/generate-csp.mjs';

const headers = readFileSync(resolve(process.cwd(), 'public/_headers'), 'utf8').replace(/\r\n/g, '\n');
const scriptSrc = headers.match(/script-src[^;]*/)?.[0] ?? '';

describe('content security policy source', () => {
  it('uses the hash placeholder and never allows unsafe inline or eval scripts', () => {
    expect(headers).toContain(PLACEHOLDER);
    expect(scriptSrc).not.toMatch(/'unsafe-inline'|'unsafe-eval'/);
  });

  it('allows Google Tag Manager and its analytics endpoints', () => {
    expect(scriptSrc).toContain('https://www.googletagmanager.com');
    expect(headers).toMatch(/connect-src[^;]*https:\/\/www\.google-analytics\.com/);
  });

  it('keeps inline style attributes working', () => {
    expect(headers).toMatch(/style-src 'self' 'unsafe-inline'/);
  });
});

describe('build-time hash generator', () => {
  const html = '<html><head><script type="module">console.log("island")</script><script type="application/ld+json">{"@type":"Thing"}</script><script src="/app.js"></script></head></html>';

  it('hashes executed inline scripts only', () => {
    const hashes = inlineScriptHashes(html);
    expect(hashes.size).toBe(1);
    expect([...hashes][0]).toMatch(/^'sha256-[A-Za-z0-9+/=]+'$/);
  });

  it('reports inline event handlers so they cannot return unnoticed', () => {
    expect(inlineHandlers('<link onload="this.media=\'all\'">')).toHaveLength(1);
    expect(inlineHandlers('<link data-font-onload>')).toHaveLength(0);
  });

  it('refuses to write a policy that allows unsafe inline scripts', () => {
    expect(() => buildHeaders(`script-src 'self' 'unsafe-inline' ${PLACEHOLDER};`, new Set())).toThrow(/unsafe-inline/);
  });

  it('fills the placeholder with the sorted hashes', () => {
    const out = buildHeaders(`script-src 'self' ${PLACEHOLDER} https://www.googletagmanager.com;`, new Set(["'sha256-b='", "'sha256-a='"]));
    expect(out).toContain("script-src 'self' 'sha256-a=' 'sha256-b=' https://www.googletagmanager.com;");
  });
});
