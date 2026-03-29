import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dirArg = process.argv.find((arg) => arg.startsWith('--dir='));
const domainArg = process.argv.find((arg) => arg.startsWith('--domain='));

const targetDir = path.resolve(root, dirArg ? dirArg.replace('--dir=', '') : 'dist');
const baseDomain = (domainArg ? domainArg.replace('--domain=', '') : 'silvertechdirectory.com')
  .replace(/^https?:\/\//i, '')
  .replace(/\/+$/, '')
  .toLowerCase();

const allowedHosts = new Set([baseDomain, `www.${baseDomain}`]);
const legacyRegulationsPattern = /^\/states\/[^/]+\/regulations(?:\/|$)/i;
const regulationsPattern = /^\/regulations(?:\/|$)/i;

type Finding = {
  source: string;
  href: string;
  resolved: string;
};

const walkHtmlFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(absolutePath));
      continue;
    }
    if (entry.isFile() && absolutePath.endsWith('.html')) {
      files.push(absolutePath);
    }
  }

  return files;
};

const getPageUrlPath = (htmlPath: string): string => {
  const relative = path.relative(targetDir, htmlPath).replace(/\\/g, '/');
  if (relative === 'index.html') return '/';
  if (relative.endsWith('/index.html')) return `/${relative.slice(0, -'index.html'.length)}`;
  return `/${relative}`;
};

const extractHrefs = (html: string): string[] => {
  const hrefs: string[] = [];
  const regex = /href\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;
  let match: RegExpExecArray | null = regex.exec(html);
  while (match) {
    const href = (match[1] ?? match[2] ?? match[3] ?? '').trim();
    if (href) hrefs.push(href);
    match = regex.exec(html);
  }
  return hrefs;
};

const isSkippableHref = (href: string): boolean =>
  href.startsWith('#') ||
  href.startsWith('mailto:') ||
  href.startsWith('tel:') ||
  href.startsWith('javascript:') ||
  href.startsWith('data:');

const resolveInternalPath = (href: string, pageUrlPath: string): string | null => {
  if (isSkippableHref(href) || href.startsWith('//')) return null;

  try {
    const base = new URL(`https://${baseDomain}${pageUrlPath}`);
    const url = new URL(href, base);
    if (!allowedHosts.has(url.hostname.toLowerCase())) return null;
    return url.pathname;
  } catch {
    return null;
  }
};

if (!fs.existsSync(targetDir)) {
  console.error(`Directory not found: ${targetDir}`);
  process.exit(1);
}

const htmlFiles = walkHtmlFiles(targetDir);
if (htmlFiles.length === 0) {
  console.error(`No HTML files found under: ${targetDir}`);
  process.exit(1);
}

const legacyFindings: Finding[] = [];
let internalLinkCount = 0;
let regulationsLinkCount = 0;

for (const htmlFile of htmlFiles) {
  const pageUrlPath = getPageUrlPath(htmlFile);
  const html = fs.readFileSync(htmlFile, 'utf8');
  const hrefs = extractHrefs(html);

  for (const href of hrefs) {
    const resolvedPath = resolveInternalPath(href, pageUrlPath);
    if (!resolvedPath) continue;

    internalLinkCount += 1;

    if (regulationsPattern.test(resolvedPath) || legacyRegulationsPattern.test(resolvedPath)) {
      regulationsLinkCount += 1;
    }

    if (legacyRegulationsPattern.test(resolvedPath)) {
      legacyFindings.push({
        source: pageUrlPath,
        href,
        resolved: resolvedPath,
      });
    }
  }
}

console.log(`Scanned HTML files: ${htmlFiles.length}`);
console.log(`Internal links checked: ${internalLinkCount}`);
console.log(`Regulations-related links found: ${regulationsLinkCount}`);

if (legacyFindings.length === 0) {
  console.log('PASS: No legacy /states/:state/regulations internal links found.');
  process.exit(0);
}

console.error(`FAIL: Found ${legacyFindings.length} legacy internal regulations link(s).`);
for (const finding of legacyFindings.slice(0, 50)) {
  console.error(`- source: ${finding.source} | href: ${finding.href} | resolved: ${finding.resolved}`);
}
if (legacyFindings.length > 50) {
  console.error(`...and ${legacyFindings.length - 50} more`);
}
process.exit(1);
