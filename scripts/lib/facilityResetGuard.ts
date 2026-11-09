// Guards the scripts that delete every facility before they reseed.
//
// A reset is refused:
// - against the production Supabase project, always, whatever the environment says;
// - against any other hosted project, unless FACILITY_RESET_CONFIRM names that project's reference;
// - against any host that is neither local nor a Supabase project URL.
//
// A local Supabase instance (localhost, 127.0.0.1, or [::1]) needs no confirmation, so local development and tests keep working.

// The production project's reference, which is the subdomain of its Supabase URL. Keep this in sync with production.
export const PRODUCTION_PROJECT_REF = 'cqalqsyiiixbdoeabgyq';

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

export type ResetTarget = { kind: 'local' } | { kind: 'project'; ref: string };

export const resetTargetFor = (supabaseUrl: string): ResetTarget => {
  let host: string;
  try {
    host = new URL(supabaseUrl).hostname.toLowerCase();
  } catch {
    throw new Error(`Refusing to reset facilities: VITE_SUPABASE_URL is not a valid URL.`);
  }

  if (LOCAL_HOSTS.has(host)) return { kind: 'local' };

  const match = /^([a-z0-9]+)\.supabase\.co$/.exec(host);
  if (!match) {
    throw new Error(
      `Refusing to reset facilities: ${host} is neither a local host nor a Supabase project URL (<ref>.supabase.co).`,
    );
  }
  return { kind: 'project', ref: match[1] };
};

export const assertFacilityResetAllowed = (supabaseUrl: string, env: Record<string, string | undefined>): void => {
  const target = resetTargetFor(supabaseUrl);
  if (target.kind === 'local') return;

  if (target.ref === PRODUCTION_PROJECT_REF) {
    throw new Error(
      'Refusing to reset facilities: this URL is the production Supabase project. This script deletes every facility and licensing row. It cannot be run against production.',
    );
  }

  if (env.FACILITY_RESET_CONFIRM !== target.ref) {
    throw new Error(
      `Refusing to reset facilities in project ${target.ref}: this deletes every facility and licensing row. To confirm, set FACILITY_RESET_CONFIRM=${target.ref}.`,
    );
  }
};
