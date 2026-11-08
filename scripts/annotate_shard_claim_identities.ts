// Adds database_facility_id to the committed directory shards from the committed UUID map.
//
// Use this instead of a full index rebuild when the source CSV is not available. It only adds the field:
// it refuses to write a shard unless re-serializing the parsed file reproduces the committed bytes exactly.
// Run with: npx tsx scripts/annotate_shard_claim_identities.ts
import fs from 'node:fs';
import path from 'node:path';
import { attachDatabaseFacilityIds, loadMapRows, type ShardRecord } from './lib/facilityClaimIdentity';

const root = process.cwd();
const shardsDir = path.join(root, 'public/facilities_index_shards');
const rows = loadMapRows(fs.readFileSync(path.join(root, 'data/facility-uuid-map.tsv'), 'utf8'));

const totals = { mapped: 0, unresolved: 0, no_map_row: 0, files: 0 };

for (const file of fs.readdirSync(shardsDir).filter((f) => /^[A-Z]{2}\.json$/.test(f)).sort()) {
  const filePath = path.join(shardsDir, file);
  // Git stores these files with LF. A Windows checkout with core.autocrlf may hold CRLF, so compare with LF.
  const original = fs.readFileSync(filePath, 'utf8').replace(/\r\n/g, '\n');
  const parsed = JSON.parse(original) as ShardRecord[];
  if (JSON.stringify(parsed, null, 2) !== original) {
    throw new Error(`${file}: re-serialization does not reproduce the committed bytes; refusing to write`);
  }
  // Records that already carry the field are re-derived, so a rerun cannot leave a stale UUID behind.
  const stripped = parsed.map(({ database_facility_id: _ignored, ...rest }) => rest as ShardRecord);
  const { records, counts } = attachDatabaseFacilityIds(stripped, rows);
  totals.mapped += counts.mapped;
  totals.unresolved += counts.unresolved;
  totals.no_map_row += counts.no_map_row;
  totals.files += 1;
  const next = JSON.stringify(records, null, 2);
  if (next !== original) fs.writeFileSync(filePath, next);
}

console.log(`Annotated ${totals.files} shards: mapped=${totals.mapped} unresolved=${totals.unresolved} no_map_row=${totals.no_map_row}`);
