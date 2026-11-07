import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// The static directory's route numbers are not the database's public_route_id values, so the route
// number cannot identify a database row. The database identifies a facility by slug, state, and city.
// A facility resolves only when exactly one row matches; an ambiguous match resolves to null.
export type FacilityIdentity = {
  id: string;
  publicSlug: string;
  state: string;
  city: string;
};

let client: SupabaseClient | null = null;
const lookups = new Map<string, Promise<string | null>>();

// One shared anon client for the facility-page islands (avoids multiple auth clients per page).
export function getFacilitySupabase(): SupabaseClient {
  if (!client) {
    client = createClient(import.meta.env.VITE_SUPABASE_URL || '', import.meta.env.VITE_SUPABASE_ANON_KEY || '');
  }
  return client;
}

export function resolveFacilityUuid(identity: FacilityIdentity): Promise<string | null> {
  const id = (identity.id || '').trim();
  if (UUID_PATTERN.test(id)) return Promise.resolve(id);

  const publicSlug = (identity.publicSlug || '').trim();
  const state = (identity.state || '').trim();
  const city = (identity.city || '').trim();
  if (!publicSlug || !state || !city) return Promise.resolve(null);

  const key = `${publicSlug}|${state}|${city}`;
  if (!lookups.has(key)) lookups.set(key, lookupByLocation(publicSlug, state, city));
  return lookups.get(key)!;
}

async function lookupByLocation(publicSlug: string, state: string, city: string): Promise<string | null> {
  const { data, error } = await getFacilitySupabase()
    .from('facilities')
    .select('id')
    .eq('public_slug', publicSlug)
    .eq('state', state)
    .eq('city', city)
    .limit(2);
  if (error) throw error;
  const rows = (data || []) as Array<{ id: string }>;
  return rows.length === 1 ? rows[0].id : null;
}
