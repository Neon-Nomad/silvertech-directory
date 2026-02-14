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
});
