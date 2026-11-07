// Computes sha256 hashes for every inline <script> in the built HTML and writes them into the
// published _headers file in place of __CSP_SCRIPT_HASHES__. Fails the build if the policy would
// need 'unsafe-inline' for scripts, or if an inline event-handler attribute reappears.
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const PLACEHOLDER = '__CSP_SCRIPT_HASHES__';
const DATA_TYPES = /type\s*=\s*["']?(application\/ld\+json|application\/json)["']?/i;

export function inlineScriptHashes(html) {
  const hashes = new Set();
  for (const match of html.matchAll(/<script(?![^>]*\ssrc\s*=)([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (DATA_TYPES.test(match[1])) continue; // data blocks are not executed
    hashes.add(`'sha256-${createHash('sha256').update(match[2]).digest('base64')}'`);
  }
  return hashes;
}

export function inlineHandlers(html) {
  return [...html.matchAll(/\son[a-z]+\s*=\s*["'][^"']*["']/gi)].map((m) => m[0].trim());
}

export function buildHeaders(headers, hashes) {
  if (!headers.includes(PLACEHOLDER)) throw new Error('_headers has no __CSP_SCRIPT_HASHES__ placeholder');
  const out = headers.replace(PLACEHOLDER, [...hashes].sort().join(' '));
  const scriptSrc = out.match(/script-src[^;]*/)?.[0] ?? '';
  if (/'unsafe-inline'|'unsafe-eval'/.test(scriptSrc)) throw new Error('script-src must not allow unsafe-inline or unsafe-eval');
  return out;
}

function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? htmlFiles(path.join(dir, e.name)) : e.name.endsWith('.html') ? [path.join(dir, e.name)] : []);
}

export function run(distDir) {
  const hashes = new Set();
  const handlers = [];
  for (const file of htmlFiles(distDir)) {
    const html = fs.readFileSync(file, 'utf8');
    for (const h of inlineScriptHashes(html)) hashes.add(h);
    for (const h of inlineHandlers(html)) handlers.push(`${path.relative(distDir, file)}: ${h}`);
  }
  if (handlers.length) throw new Error(`inline event handlers found (blocked by CSP):\n${handlers.slice(0, 10).join('\n')}`);
  if (hashes.size === 0) throw new Error('no inline script hashes found; check the build output');
  const headersPath = path.join(distDir, '_headers');
  fs.writeFileSync(headersPath, buildHeaders(fs.readFileSync(headersPath, 'utf8'), hashes), 'utf8');
  console.log(`CSP: ${hashes.size} inline script hashes written to ${headersPath}`);
  return hashes.size;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run(process.argv[2] ?? 'dist');
}
