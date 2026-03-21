import fs from 'node:fs';
import path from 'node:path';

const ROOT_DIRS = ['src/generated/regulations', 'content', 'astro-src/content'];
const TARGET_EXTENSIONS = new Set(['.json', '.md']);

const DROP_LINE_PATTERNS: RegExp[] = [
  /\bas an ai\b/i,
  /\bhelpful assistant\b/i,
  /\bbased on (my|the) training\b/i,
  /\bplaceholder\b/i,
  /\binsert (text|content|state|city|here)\b/i,
  /\bi will continue to\b/i,
  /\bappend action\b/i,
  /\bword count\b/i,
  /\bmeets? the .*word requirement\b/i,
  /\bprovided task input\b/i,
  /\bmanus ai\b/i,
  /\bnus ai\b/i,
  /\bthis content is approximately\b/i,
  /\bcurrent as of \[[^\]]+\]/i,
  /^\s*\*\*author:\*\*.*$/i,
  /^\s*\*\*date:\*\*.*$/i,
];

const INLINE_REPLACERS: Array<[RegExp, string]> = [
  [/\*\*Author:\*\*[^\n]*/gi, ''],
  [/\bAuthor:\s*Manus AI\b/gi, ''],
  [/\bManus AI\b/gi, ''],
  [/\bnus AI\b/gi, ''],
  [/\bProvided Task Input\b[^\n]*/gi, ''],
  [/\bI will continue to\b[^\n]*/gi, ''],
  [/\bAppend action\b[^\n]*/gi, ''],
  [/\[\s*Insert[^\]]*\]/gi, ''],
  [/\(\s*This content is approximately[^)]*\)/gi, ''],
  [/\(\s*Word count[^)]*\)/gi, ''],
];

const walkFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const stack = [dir];
  const out: string[] = [];

  while (stack.length > 0) {
    const current = stack.pop() as string;
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!TARGET_EXTENSIONS.has(path.extname(entry.name).toLowerCase())) continue;
      out.push(fullPath);
    }
  }

  return out;
};

const stripArtifactLines = (raw: string): string => {
  let text = raw;
  for (const [pattern, replacement] of INLINE_REPLACERS) {
    text = text.replace(pattern, replacement);
  }

  const cleanedLines = text
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => !DROP_LINE_PATTERNS.some((pattern) => pattern.test(line)));

  return cleanedLines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

const deepClean = (value: unknown): unknown => {
  if (typeof value === 'string') {
    return stripArtifactLines(value);
  }

  if (Array.isArray(value)) {
    return value.map((item) => deepClean(item));
  }

  if (value && typeof value === 'object') {
    const input = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(input)) {
      output[key] = deepClean(nested);
    }
    return output;
  }

  return value;
};

const scrubMarkdown = (filePath: string): boolean => {
  const before = fs.readFileSync(filePath, 'utf8');
  const after = stripArtifactLines(before);
  if (after === before) return false;
  fs.writeFileSync(filePath, `${after}\n`, 'utf8');
  return true;
};

const scrubJson = (filePath: string): boolean => {
  const before = fs.readFileSync(filePath, 'utf8');
  const parsed = JSON.parse(before) as unknown;
  const cleaned = deepClean(parsed);
  const after = `${JSON.stringify(cleaned, null, 2)}\n`;
  if (after === before) return false;
  fs.writeFileSync(filePath, after, 'utf8');
  return true;
};

const main = () => {
  const files = ROOT_DIRS.flatMap((root) => walkFiles(path.resolve(process.cwd(), root)));

  let touched = 0;
  let failed = 0;

  for (const filePath of files) {
    const ext = path.extname(filePath).toLowerCase();
    try {
      const changed = ext === '.json' ? scrubJson(filePath) : scrubMarkdown(filePath);
      if (changed) touched += 1;
    } catch (error) {
      failed += 1;
      console.error(`[scrub:content-artifacts] Failed: ${path.relative(process.cwd(), filePath)}`);
      console.error(error);
    }
  }

  console.log(`[scrub:content-artifacts] Scanned ${files.length} files; updated ${touched}.`);
  if (failed > 0) {
    console.error(`[scrub:content-artifacts] ${failed} file(s) failed to process.`);
    process.exit(1);
  }
};

main();
