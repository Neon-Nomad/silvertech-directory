import fs from 'node:fs';
import path from 'node:path';

type MatchHit = {
  file: string;
  line: number;
  pattern: string;
  sample: string;
};

const ROOT_DIRS = [
  'src/generated/regulations',
  'content',
  'astro-src/content',
];

const TARGET_EXTENSIONS = new Set(['.json', '.md']);

const KILL_LIST: Array<{ label: string; regex: RegExp }> = [
  { label: 'ai_self_reference', regex: /\bas an ai\b/i },
  { label: 'helpful_assistant', regex: /\bhelpful assistant\b/i },
  { label: 'training_data_claim', regex: /\bbased on (my|the) training\b/i },
  { label: 'placeholder', regex: /\bplaceholder\b/i },
  { label: 'insert_text', regex: /\binsert (text|content|state|city|here)\b/i },
  { label: 'continue_writing_note', regex: /\bi will continue to\b/i },
  { label: 'append_action_note', regex: /\bappend action\b/i },
  { label: 'word_count_note', regex: /\bword count\b/i },
  { label: 'meets_word_requirement_note', regex: /\bmeets? the .*word requirement\b/i },
  { label: 'provided_task_input', regex: /\bprovided task input\b/i },
  { label: 'manus_ai_signature', regex: /\bmanus ai\b/i },
  { label: 'manus_ai_fragment', regex: /\bnus ai\b/i },
  { label: 'meta_generation_note', regex: /\bthis content is approximately\b/i },
  { label: 'current_as_of_placeholder', regex: /\bcurrent as of \[[^\]]+\]/i },
];

const walkFiles = (dir: string): string[] => {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  const stack = [dir];

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

const sanitizeSample = (line: string): string => {
  const trimmed = line.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= 160) return trimmed;
  return `${trimmed.slice(0, 157)}...`;
};

const main = () => {
  const files = ROOT_DIRS.flatMap((root) => walkFiles(path.resolve(process.cwd(), root)));
  const hits: MatchHit[] = [];

  for (const filePath of files) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const lines = raw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i += 1) {
      const line = lines[i];
      for (const pattern of KILL_LIST) {
        if (!pattern.regex.test(line)) continue;
        hits.push({
          file: path.relative(process.cwd(), filePath),
          line: i + 1,
          pattern: pattern.label,
          sample: sanitizeSample(line),
        });
      }
    }
  }

  if (hits.length === 0) {
    console.log(`[lint:content-artifacts] Clean. Scanned ${files.length} files.`);
    return;
  }

  console.error(`[lint:content-artifacts] Found ${hits.length} artifact hit(s) across ${files.length} files.`);
  const maxToPrint = 300;
  for (const hit of hits.slice(0, maxToPrint)) {
    console.error(`- ${hit.file}:${hit.line} [${hit.pattern}] ${hit.sample}`);
  }
  if (hits.length > maxToPrint) {
    console.error(`... ${hits.length - maxToPrint} additional hit(s) omitted.`);
  }
  process.exit(1);
};

main();
