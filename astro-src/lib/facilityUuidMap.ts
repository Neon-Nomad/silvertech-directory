// Build-time access to data/facility-uuid-map.tsv. Used only in page frontmatter (server side at build),
// so none of this code or the map reaches the browser. The file is read once per build process.
import fs from 'node:fs';
import path from 'node:path';

type Entry = { status: 'mapped'; uuid: string } | { status: 'unresolved'; reason: string };

let entries: Map<string, Entry> | null = null;

function load(): Map<string, Entry> {
  const file = path.join(process.cwd(), 'data/facility-uuid-map.tsv');
  const lines = fs.readFileSync(file, 'utf8').split('\n').filter((l) => l.length > 0);
  const out = new Map<string, Entry>();
  for (const line of lines.slice(1)) {
    const [canonicalPath, status, uuid, reason] = line.split('\t');
    out.set(canonicalPath, status === 'mapped' ? { status, uuid } : { status: 'unresolved', reason });
  }
  return out;
}

// Returns the database UUID for a canonical facility path, or null when the identity is unresolved.
// An unresolved identity is never guessed: the page renders the explicit "not available" state instead.
export function getFacilityUuid(canonicalPath: string): string | null {
  if (!entries) entries = load();
  const entry = entries.get(canonicalPath);
  if (!entry) throw new Error(`no facility UUID mapping row for canonical path: ${canonicalPath}`);
  return entry.status === 'mapped' ? entry.uuid : null;
}

