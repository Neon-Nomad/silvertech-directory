import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';

dotenv.config();

type Args = {
  email?: string;
  facilityId?: string;
  setPlan?: 'free' | 'featured' | 'priority' | 'lead_suite';
};

type UserRecord = {
  id: string;
  email?: string | null;
};

type FacilityRecord = {
  id: string;
  name: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  owner_id: string | null;
};

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.');
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (name: string): string | undefined => {
    const idx = args.findIndex((arg) => arg === `--${name}`);
    if (idx === -1) return undefined;
    return args[idx + 1];
  };

  const setPlanRaw = get('set-plan');
  const validPlans = new Set(['free', 'featured', 'priority', 'lead_suite']);
  const setPlan = setPlanRaw && validPlans.has(setPlanRaw) ? (setPlanRaw as Args['setPlan']) : undefined;

  return {
    email: get('email') || process.env.TEST_OPERATOR_EMAIL || undefined,
    facilityId: get('facility-id') || undefined,
    setPlan,
  };
}

async function listAllUsersByEmail(email: string): Promise<UserRecord | null> {
  let page = 1;
  const perPage = 200;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((u) => (u.email || '').toLowerCase() === email.toLowerCase());
    if (match) return { id: match.id, email: match.email };
    if (users.length < perPage) break;
    page += 1;
  }

  return null;
}

async function resolveFacility(userId: string, facilityIdArg?: string): Promise<FacilityRecord> {
  if (facilityIdArg) {
    const { data, error } = await supabase
      .from('facilities')
      .select('id,name,city,state,postal_code,owner_id')
      .eq('id', facilityIdArg)
      .single();
    if (error || !data) throw new Error(`Facility not found for id ${facilityIdArg}`);
    return data as FacilityRecord;
  }

  const { data: owned, error: ownedError } = await supabase
    .from('facilities')
    .select('id,name,city,state,postal_code,owner_id')
    .eq('owner_id', userId)
    .limit(1);
  if (ownedError) throw ownedError;
  if (owned && owned.length > 0) return owned[0] as FacilityRecord;

  const { data: claims, error: claimError } = await supabase
    .from('facility_claims')
    .select('facility_id,status,updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1);
  if (claimError) throw claimError;

  if (!claims || claims.length === 0 || !claims[0].facility_id) {
    throw new Error('No owned or claimed facility found for this user.');
  }

  const { data: claimedFacility, error: facilityError } = await supabase
    .from('facilities')
    .select('id,name,city,state,postal_code,owner_id')
    .eq('id', claims[0].facility_id)
    .single();
  if (facilityError || !claimedFacility) throw new Error('Claimed facility exists, but facility record was not found.');

  return claimedFacility as FacilityRecord;
}

async function ensureOwnership(userId: string, facility: FacilityRecord): Promise<FacilityRecord> {
  const nextPatch: Record<string, string> = {};
  if (!facility.owner_id) nextPatch.owner_id = userId;
  nextPatch.assigned_plan_owner_id = userId;

  if (Object.keys(nextPatch).length > 0) {
    const { error } = await supabase
      .from('facilities')
      .update(nextPatch)
      .eq('id', facility.id);
    if (error) throw error;
  }

  const { data, error } = await supabase
    .from('facilities')
    .select('id,name,city,state,postal_code,owner_id')
    .eq('id', facility.id)
    .single();
  if (error || !data) throw new Error('Failed to reload facility after ownership update.');
  return data as FacilityRecord;
}

async function ensureUserProfile(userId: string, setPlan?: Args['setPlan']) {
  const { data: existing, error: existingError } = await supabase
    .from('user_profiles')
    .select('id,plan,billing_status,facility_assignments_remaining')
    .eq('id', userId)
    .maybeSingle();
  if (existingError) throw existingError;

  const base = {
    id: userId,
    updated_at: new Date().toISOString(),
  } as Record<string, unknown>;

  if (!existing) {
    base.created_at = new Date().toISOString();
    base.plan = setPlan || 'free';
    base.billing_status = setPlan && setPlan !== 'free' ? 'active' : 'inactive';
    base.facility_assignments_remaining = setPlan === 'lead_suite' ? 25 : setPlan === 'priority' ? 10 : setPlan === 'featured' ? 3 : 1;
  } else if (setPlan) {
    base.plan = setPlan;
    base.billing_status = setPlan === 'free' ? 'inactive' : 'active';
    base.facility_assignments_remaining = setPlan === 'lead_suite' ? 25 : setPlan === 'priority' ? 10 : setPlan === 'featured' ? 3 : 1;
  }

  const { error: upsertError } = await supabase
    .from('user_profiles')
    .upsert(base, { onConflict: 'id' });
  if (upsertError) throw upsertError;
}

async function seedLeads(facilityId: string) {
  const leadRows = [
    {
      facility_id: facilityId,
      name: 'Avery Carter',
      phone: '(469) 555-0101',
      email: 'seed.family.1+silvertech@example.com',
      message: 'Looking for memory care with strong activities and secure layout.',
      move_in_timeframe: '30-60 days',
      source: 'facility_inquiry',
      care_type: 'Memory Care',
      budget: '$5,000-$6,500',
      status: 'new',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      metadata: { seed_tag: 'claimed_facility_dashboard_v1' },
    },
    {
      facility_id: facilityId,
      name: 'Jordan Lee',
      phone: '(214) 555-0188',
      email: 'seed.family.2+silvertech@example.com',
      message: 'Need pricing and availability for assisted living.',
      move_in_timeframe: 'ASAP',
      source: 'facility_inquiry',
      care_type: 'Assisted Living',
      budget: '$4,000-$5,000',
      status: 'contacted',
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
      metadata: { seed_tag: 'claimed_facility_dashboard_v1' },
    },
  ];

  const { error } = await supabase.from('leads').insert(leadRows);
  if (error) throw error;
}

async function seedLeadEvents(facilityId: string) {
  const now = Date.now();
  const makeSession = () => randomUUID();
  const sessions = [makeSession(), makeSession(), makeSession(), makeSession()];
  const rows = [
    { session_id: sessions[0], event_type: 'page_view', offsetH: 2 },
    { session_id: sessions[0], event_type: 'faq_viewed', offsetH: 2 },
    { session_id: sessions[0], event_type: 'phone_reveal', offsetH: 2 },
    { session_id: sessions[1], event_type: 'page_view', offsetH: 8 },
    { session_id: sessions[1], event_type: 'comparison_added', offsetH: 8 },
    { session_id: sessions[2], event_type: 'page_view', offsetH: 20 },
    { session_id: sessions[2], event_type: 'directions_clicked', offsetH: 20 },
    { session_id: sessions[3], event_type: 'page_view', offsetH: 30 },
    { session_id: sessions[3], event_type: 'schedule_tour', offsetH: 30 },
  ].map((row) => ({
    facility_id: facilityId,
    session_id: row.session_id,
    event_type: row.event_type,
    created_at: new Date(now - row.offsetH * 60 * 60 * 1000).toISOString(),
    metadata: { seed_tag: 'claimed_facility_dashboard_v1' },
  }));

  const { error } = await supabase.from('lead_events').insert(rows);
  if (error) throw error;
}

async function seedActivationEvents(userId: string, facilityId: string) {
  const sessionId = randomUUID();
  const events = [
    'operator_claim_completed',
    'operator_activation_screen_viewed',
    'field_updated',
    'checklist_step_completed',
    'benchmark_module_viewed',
    'roi_module_viewed',
  ];

  const rows = events.map((eventName, index) => ({
    event_name: eventName,
    operator_id: userId,
    facility_id: facilityId,
    session_id: sessionId,
    plan_tier: 'premium',
    activation_score: Math.min(95, 45 + index * 8),
    source_screen: eventName === 'operator_activation_screen_viewed' ? 'dashboard_overview' : 'dashboard_leads',
    properties: { seed_tag: 'claimed_facility_dashboard_v1' },
    occurred_at: new Date(Date.now() - (events.length - index) * 60 * 60 * 1000).toISOString(),
  }));

  const { error } = await supabase.from('operator_activation_events').insert(rows);
  if (error) throw error;
}

async function seedVaultLineage(facility: FacilityRecord) {
  const sourceEvents = [
    { source: 'web', suffix: 'web', confidence: 0.84 },
    { source: 'dashboard', suffix: 'dashboard', confidence: 0.92 },
    { source: 'api', suffix: 'api', confidence: 0.88 },
  ] as const;

  const basePayload = {
    facility_id: facility.id,
    facility_name: facility.name,
    city: facility.city,
    state: facility.state,
    postal_code: facility.postal_code,
  };

  const { data: enrichedPayload, error: enrichError } = await supabase.rpc('enrich_canonical_facility_payload', {
    p_facility_id: facility.id,
    p_payload: basePayload,
  });
  if (enrichError) throw enrichError;

  const dedupeKey = `seed:facility:${facility.id}`;
  const { data: canonicalRow, error: canonicalError } = await supabase
    .from('canonical_facility_records')
    .upsert(
      {
        facility_id: facility.id,
        source_priority: 1,
        source_system: 'dashboard',
        schema_version: '1.0.0',
        dedupe_key: dedupeKey,
        canonical_payload: enrichedPayload || basePayload,
        confidence_score: 0.93,
        pii_present: false,
        last_normalized_at: new Date().toISOString(),
      },
      { onConflict: 'dedupe_key' }
    )
    .select('id')
    .single();
  if (canonicalError || !canonicalRow?.id) throw canonicalError || new Error('Failed to upsert canonical facility record.');

  for (const evt of sourceEvents) {
    const sourceEventId = `seed-vault-${evt.suffix}-${facility.id}`;
    const occurredAt = new Date(Date.now() - Math.floor(Math.random() * 48) * 60 * 60 * 1000).toISOString();
    const { data: rawEventId, error: rawError } = await supabase.rpc('ingest_raw_event', {
      p_source_system: evt.source,
      p_canonical_entity: 'facility',
      p_payload: basePayload,
      p_source_event_id: sourceEventId,
      p_occurred_at: occurredAt,
      p_schema_version: '1.0.0',
      p_metadata: { seed_tag: 'claimed_facility_dashboard_v1' },
    });
    if (rawError || !rawEventId) throw rawError || new Error(`Failed to ingest raw event for ${evt.source}.`);

    const { error: normalizeError } = await supabase.rpc('record_normalization_result', {
      p_raw_event_id: rawEventId,
      p_canonical_entity: 'facility',
      p_status: 'normalized',
      p_normalized_table: 'canonical_facility_records',
      p_normalized_record_id: canonicalRow.id,
      p_dedupe_key: `${dedupeKey}:${evt.suffix}`,
      p_confidence_score: evt.confidence,
      p_processing_error: null,
      p_run_id: null,
      p_metadata: { seed_tag: 'claimed_facility_dashboard_v1', source: evt.source },
    });
    if (normalizeError) throw normalizeError;

    const { error: linkError } = await supabase
      .from('canonical_identity_links')
      .upsert(
        {
          canonical_entity: 'facility',
          canonical_record_id: canonicalRow.id,
          raw_event_id: rawEventId,
          dedupe_key: `${dedupeKey}:${evt.suffix}`,
          confidence_score: evt.confidence,
          metadata: { seed_tag: 'claimed_facility_dashboard_v1' },
        },
        { onConflict: 'canonical_entity,dedupe_key' }
      );
    if (linkError) throw linkError;
  }
}

async function main() {
  const args = parseArgs();

  if (!args.email) {
    throw new Error('Missing email. Pass --email you@domain.com or set TEST_OPERATOR_EMAIL.');
  }

  console.log(`Resolving operator user for ${args.email}...`);
  const user = await listAllUsersByEmail(args.email);
  if (!user) throw new Error(`No auth user found for email ${args.email}`);

  console.log('Resolving claimed facility...');
  const facility = await resolveFacility(user.id, args.facilityId);
  const ensuredFacility = await ensureOwnership(user.id, facility);

  console.log(`Using facility: ${ensuredFacility.name || ensuredFacility.id} (${ensuredFacility.id})`);
  await ensureUserProfile(user.id, args.setPlan);

  console.log('Seeding leads and lead events...');
  await seedLeads(ensuredFacility.id);
  await seedLeadEvents(ensuredFacility.id);

  console.log('Seeding activation events...');
  await seedActivationEvents(user.id, ensuredFacility.id);

  console.log('Seeding Vault lineage...');
  await seedVaultLineage(ensuredFacility);

  console.log('Done. Seeded dashboard data for one claimed facility.');
  console.log('Tip: Refresh /dashboard/listings, /dashboard/leads, /dashboard/vault.');
}

main().catch((err) => {
  console.error('Seed failed:', err?.message || err);
  process.exit(1);
});

