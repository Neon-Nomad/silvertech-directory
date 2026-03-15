import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('facility edge canonical redirect contract', () => {
  it('hydrates metadata directly on /community paths without redirecting', () => {
    const edgeFn = read('netlify/edge-functions/facility-metadata.ts');

    expect(edgeFn).toContain("path: '/community/*'");
    expect(edgeFn).toContain('const pathParts = parseCommunityPath(url.pathname);');
    expect(edgeFn).toContain('return buildNotFoundResponse(url.pathname);');
    expect(edgeFn).not.toContain('Response.redirect(');
  });
});
