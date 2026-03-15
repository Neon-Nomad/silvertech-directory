import { describe, it, expect } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SERVICE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY;

if (runIntegration && (!supabaseUrl || !supabaseKey)) {
  throw new Error('Missing Supabase credentials for integration tests');
}

const supabase = runIntegration ? createClient(supabaseUrl, supabaseKey) : null;
const describeIfIntegration = runIntegration ? describe : describe.skip;

describeIfIntegration('Backend Integrity', () => {
  it('should have facilities in the database', async () => {
    const { count, error } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true });

    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
  }, 15000);

  it('should have licensing data linked to facilities', async () => {
    const { data, error } = await supabase
      .from('facility_licensing')
      .select('facility_id')
      .limit(10);

    expect(error).toBeNull();
    expect(data.length).toBeGreaterThan(0);

    const facilityId = data[0].facility_id;
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', facilityId)
      .single();

    expect(facilityError).toBeNull();
    expect(facility).toBeDefined();
  }, 15000);

  it('should not have duplicate license numbers', async () => {
    const { data } = await supabase
      .from('facility_licensing')
      .select('license_number')
      .not('license_number', 'is', null)
      .limit(1);

    if (!data?.length) return;
    const license = data[0].license_number;
    if (!license) return;

    const { count } = await supabase
      .from('facility_licensing')
      .select('*', { count: 'exact', head: true })
      .eq('license_number', license);

    expect(count).toBe(1);
  }, 15000);

  it('should have California facilities', async () => {
    const { count, error } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true })
      .eq('state', 'CA');

    expect(error).toBeNull();
    expect(count).toBeGreaterThan(0);
  }, 15000);

  it('search_facilities RPC should return live rows for a valid state filter', async () => {
    const { data, error } = await supabase.rpc('search_facilities', {
      query_text: null,
      state_filter: 'CA',
      city_filter: null,
      postal_filter: null,
      limit_count: 20,
      offset_count: 0,
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
    expect((data[0] || {}).state).toBe('CA');
    expect((data[0] || {}).public_slug).toBeTruthy();
    expect((data[0] || {}).public_route_id).toBeTruthy();
    expect((data[0] || {}).primary_care_type_slug).toBeTruthy();
  }, 15000);

  it('search_facilities RPC should return deduplicated rows in-page', async () => {
    const { data, error } = await supabase.rpc('search_facilities', {
      query_text: 'Sunrise',
      state_filter: null,
      city_filter: null,
      postal_filter: null,
      limit_count: 50,
      offset_count: 0,
    });

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const toSlug = (value) =>
      String(value || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

    const keys = new Set();
    for (const row of data) {
      const key = [
        String(row.name || '').toLowerCase().trim(),
        String(row.address_line1 || '').toLowerCase().trim(),
        toSlug(row.city || ''),
        String(row.state || '').trim().toUpperCase(),
        String(row.postal_code || '').trim(),
      ].join('|');
      keys.add(key);
    }

    expect(keys.size).toBe(data.length);
  }, 15000);

  it('facilities should have public identity fields populated for canonical routing', async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('id, public_slug, public_route_id, primary_care_type_slug')
      .limit(25);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    for (const row of data) {
      expect(row.public_slug).toBeTruthy();
      expect(row.public_route_id).toBeTruthy();
      expect(row.primary_care_type_slug).toBeTruthy();
    }
  }, 15000);

  it('public_route_id should behave like a unique public identifier', async () => {
    const { data, error } = await supabase
      .from('facilities')
      .select('public_route_id')
      .not('public_route_id', 'is', null)
      .limit(10);

    expect(error).toBeNull();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);

    const routeId = data[0].public_route_id;
    const { count, error: countError } = await supabase
      .from('facilities')
      .select('*', { count: 'exact', head: true })
      .eq('public_route_id', routeId);

    expect(countError).toBeNull();
    expect(count).toBe(1);
  }, 15000);
});
