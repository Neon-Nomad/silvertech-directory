import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// The static directory identifies a facility as `${public_slug}-${public_route_id}`. The database
// identifies the same facility by a UUID, and the family features need the UUID.
const STATIC_FACILITY_ID = /^(.+)-(\d+)$/;

let client: SupabaseClient | null = null;
const lookups = new Map<string, Promise<string | null>>();

// One shared anon client for the facility-page islands (avoids multiple auth clients per page).
export function getFacilitySupabase(): SupabaseClient {
  if (!client) {
    client = createClient(import.meta.env.VITE_SUPABASE_URL || '', import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  }
  return client;
}

// Returns the database UUID for a facility identifier, or null when the facility has no database row.
// UUIDs pass through unchanged. Results are cached per identifier.
export function resolveFacilityUuid(facilityId: string): Promise<string | null> {
  const id = (facilityId || '').trim();
  if (UUID_PATTERN.test(id)) return Promise.resolve(id);

  const match = id.match(STATIC_FACILITY_ID);
  if (!match) return Promise.resolve(null);

  if (!lookups.has(id)) lookups.set(id, lookupByPublicIdentity(match[1], Number(match[2])));
  return lookups.get(id)!;
}

async function lookupByPublicIdentity(publicSlug: string, publicRouteId: number): Promise<string | null> {
  const { data, error } = await getFacilitySupabase()
    .from('facilities')
    .select('id')
    .eq('public_slug', publicSlug)
    .eq('public_route_id', publicRouteId)
    .maybeSingle();
  if (error) throw error;
  return (data?.id as string | undefined) ?? null;
}
