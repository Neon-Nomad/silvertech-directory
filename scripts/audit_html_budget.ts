import fs from 'node:fs';
import path from 'node:path';

const TWO_MB_BYTES = 2 * 1024 * 1024;
const root = process.cwd();
const argDir = process.argv.find((arg) => arg.startsWith('--dir='));
const targetDir = path.resolve(root, argDir ? argDir.replace('--dir=', '') : 'dist-astro');
const reportPath = path.resolve(root, 'docs/seo_html_budget_report.csv');

const walkHtmlFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkHtmlFiles(absolute));
      continue;
    }
    if (entry.isFile() && absolute.endsWith('.html')) files.push(absolute);
  }
  return files;
};

const csvEscape = (value: string): string => {
  const normalized = value.replace(/\r?\n/g, ' ').trim();
  if (normalized.includes('"') || normalized.includes(',')) {
    return `"${normalized.replace(/"/g, '""')}"`;
  }
  return normalized;
};

const getUniquenessMarker = (relativePath: string): string => {
  if (/(assisted-living|memory-care|nursing-homes|independent-living|residential-care|adult-day-services|ccrc)\/[^/]+\/[^/]+\/index\.html$/i.test(relativePath)) return 'Local Data Signals';
  if (/(assisted-living|memory-care|nursing-homes|independent-living|residential-care|adult-day-services|ccrc)\/[^/]+\/index\.html$/i.test(relativePath)) return 'Statewide Data Signals';
  if (/(assisted-living|memory-care|nursing-homes|independent-living|residential-care|adult-day-services|ccrc)\/index\.html$/i.test(relativePath)) return 'Care Type Directory Signals';
  if (/community\/[^/]+\/index\.html$/i.test(relativePath)) return 'Facility Data Signals';
  if (/regulations\/[^/]+\/[^/]+\/index\.html$/i.test(relativePath)) return 'Regulations Topic Signals';
  if (/regulations\/[^/]+\/index\.html$/i.test(relativePath)) return 'Regulations State Signals';
  if (/guides\/index\.html$/i.test(relativePath)) return 'Editorial Integrity Signals';
  if (/guides\/[^/]+\/index\.html$/i.test(relativePath)) return 'Guide Evidence Signals';
  return '';
};

const toByteOffset = (value: string, charIndex: number): number => {
  if (charIndex < 0) return -1;
  return Buffer.byteLength(value.slice(0, charIndex), 'utf8');
};

const findBodyContentStart = (html: string): number => {
  const bodyOpen = html.search(/<body\b/i);
  if (bodyOpen < 0) return 0;
  const bodyClose = html.indexOf('>', bodyOpen);
  if (bodyClose < 0) return 0;
  return bodyClose + 1;
};

if (!fs.existsSync(targetDir)) {
  throw new Error(`Directory not found: ${targetDir}`);
}

const htmlFiles = walkHtmlFiles(targetDir);
if (htmlFiles.length === 0) {
  throw new Error(`No HTML files found under: ${targetDir}`);
}

const rows: string[] = [
  [
    'path',
    'bytes_uncompressed',
    'over_2mb',
    'crawl_window_bytes',
    'body_start_byte',
    'h1_pos_byte',
    'h1_in_first_2mb',
    'top20_byte_cutoff',
    'h1_in_top20_html',
    'top20_body_byte_cutoff',
    'h1_in_top20_body',
    'uniqueness_marker',
    'uniqueness_pos_byte',
    'uniqueness_in_first_2mb',
    'uniqueness_in_top20_html',
    'uniqueness_in_top20_body'
  ].join(',')
];

let over2mbCount = 0;
let h1First2MbCount = 0;
let h1Top20HtmlCount = 0;
let h1Top20BodyCount = 0;
let uniqueFirst2MbCount = 0;
let uniqueTop20HtmlCount = 0;
let uniqueTop20BodyCount = 0;
let uniqueEligibleCount = 0;
let h1FoundCount = 0;

type Largest = { path: string; bytes: number };
const largestPages: Largest[] = [];

for (const filePath of htmlFiles) {
  const html = fs.readFileSync(filePath, 'utf-8');
  const bytes = Buffer.byteLength(html, 'utf8');
  const relativePath = path.relative(targetDir, filePath).replace(/\\/g, '/');
  const crawlWindowBytes = Math.min(TWO_MB_BYTES, bytes);
  const topCutoffHtml = Math.floor(bytes * 0.2);
  const bodyStartChar = findBodyContentStart(html);
  const bodyStartByte = toByteOffset(html, bodyStartChar);
  const bodyByteLength = Math.max(0, bytes - bodyStartByte);
  const topCutoffBody = bodyStartByte + Math.floor(bodyByteLength * 0.2);

  const h1CharPos = html.search(/<h1\b/i);
  const h1PosByte = toByteOffset(html, h1CharPos);
  const h1InFirst2Mb = h1PosByte >= 0 && h1PosByte <= crawlWindowBytes;
  const h1InTop20Html = h1PosByte >= 0 && h1PosByte <= topCutoffHtml;
  const h1InTop20Body = h1PosByte >= 0 && h1PosByte <= topCutoffBody;

  const uniquenessMarker = getUniquenessMarker(relativePath);
  const uniquenessCharPos = uniquenessMarker ? html.indexOf(uniquenessMarker) : -1;
  const uniquenessPosByte = toByteOffset(html, uniquenessCharPos);
  const uniquenessInFirst2Mb = uniquenessMarker ? uniquenessPosByte >= 0 && uniquenessPosByte <= crawlWindowBytes : false;
  const uniquenessInTop20Html = uniquenessMarker ? uniquenessPosByte >= 0 && uniquenessPosByte <= topCutoffHtml : false;
  const uniquenessInTop20Body = uniquenessMarker ? uniquenessPosByte >= 0 && uniquenessPosByte <= topCutoffBody : false;

  if (bytes > TWO_MB_BYTES) over2mbCount += 1;
  if (h1PosByte >= 0) h1FoundCount += 1;
  if (h1InFirst2Mb) h1First2MbCount += 1;
  if (h1InTop20Html) h1Top20HtmlCount += 1;
  if (h1InTop20Body) h1Top20BodyCount += 1;
  if (uniquenessMarker) uniqueEligibleCount += 1;
  if (uniquenessInFirst2Mb) uniqueFirst2MbCount += 1;
  if (uniquenessInTop20Html) uniqueTop20HtmlCount += 1;
  if (uniquenessInTop20Body) uniqueTop20BodyCount += 1;

  largestPages.push({ path: relativePath, bytes });

  rows.push(
    [
      relativePath,
      String(bytes),
      bytes > TWO_MB_BYTES ? 'true' : 'false',
      String(crawlWindowBytes),
      String(bodyStartByte),
      String(h1PosByte),
      h1InFirst2Mb ? 'true' : 'false',
      String(topCutoffHtml),
      h1InTop20Html ? 'true' : 'false',
      String(topCutoffBody),
      h1InTop20Body ? 'true' : 'false',
      uniquenessMarker,
      String(uniquenessPosByte),
      uniquenessInFirst2Mb ? 'true' : 'false',
      uniquenessInTop20Html ? 'true' : 'false',
      uniquenessInTop20Body ? 'true' : 'false'
    ]
      .map((cell) => csvEscape(cell))
      .join(',')
  );
}

largestPages.sort((a, b) => b.bytes - a.bytes);
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, rows.join('\n') + '\n', 'utf-8');

const uniqueFirst2MbPct = uniqueEligibleCount > 0 ? Math.round((uniqueFirst2MbCount / uniqueEligibleCount) * 100) : 0;
const uniqueTop20HtmlPct = uniqueEligibleCount > 0 ? Math.round((uniqueTop20HtmlCount / uniqueEligibleCount) * 100) : 0;
const uniqueTop20BodyPct = uniqueEligibleCount > 0 ? Math.round((uniqueTop20BodyCount / uniqueEligibleCount) * 100) : 0;

console.log(`Audited HTML files: ${htmlFiles.length}`);
console.log(`Over 2MB pages: ${over2mbCount}`);
console.log(`H1 found: ${h1FoundCount}/${htmlFiles.length}`);
console.log(`H1 in first 2MB: ${h1First2MbCount}/${htmlFiles.length}`);
console.log(`H1 in top 20% (full HTML): ${h1Top20HtmlCount}/${htmlFiles.length}`);
console.log(`H1 in top 20% (body-only): ${h1Top20BodyCount}/${htmlFiles.length}`);
console.log(`Uniqueness in first 2MB: ${uniqueFirst2MbCount}/${uniqueEligibleCount} (${uniqueFirst2MbPct}%)`);
console.log(`Uniqueness in top 20% (full HTML): ${uniqueTop20HtmlCount}/${uniqueEligibleCount} (${uniqueTop20HtmlPct}%)`);
console.log(`Uniqueness in top 20% (body-only): ${uniqueTop20BodyCount}/${uniqueEligibleCount} (${uniqueTop20BodyPct}%)`);
console.log(`Report: ${reportPath}`);
console.log('Largest pages:');
for (const page of largestPages.slice(0, 10)) {
  console.log(`- ${page.path} (${page.bytes} bytes)`);
}
