// Writes one JSON line per facility: the primary-care canonical path the build emits, plus the
// entity identity key that links the same facility across identity schemes. Run from the repository
// root (or a copy of it) so the store reads that tree's data: npx tsx scripts/dump_facility_identity_snapshot.ts <out>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const outPath = process.argv[2];
if (!outPath) {
  console.error('usage: tsx scripts/dump_facility_identity_snapshot.ts <out.jsonl>');
  process.exit(1);
}

const moduleUrl = pathToFileURL(path.resolve(process.cwd(), 'astro-src/lib/seniorLivingData.ts')).href;
const store = await import(moduleUrl);

const lines = store.getAllFacilities().map((facility: any) => {
  const identityKey = store.getFacilityIdentityKey(facility);
  return JSON.stringify({
    path: `${facility.primaryCareType}/${facility.stateSlug}/${facility.citySlug}/${facility.publicSlug}-${facility.publicRouteId}`,
    identityKey,
    stateSlug: facility.stateSlug,
    citySlug: facility.citySlug,
    publicSlug: facility.publicSlug,
    publicRouteId: facility.publicRouteId,
    legacyRouteIds: facility.legacyRouteIds,
    careTypes: facility.careTypes,
  });
});

fs.writeFileSync(outPath, `${lines.sort().join('\n')}\n`);
console.log(`facilities ${lines.length}`);
