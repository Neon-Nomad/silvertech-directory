import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215193000_add_trust_enrichment_and_lineage.sql'
);
const contractPath = path.resolve(process.cwd(), 'data-contract.yaml');
const normalizeScriptPath = path.resolve(process.cwd(), 'scripts/pipeline_normalize.ts');

describe('trust enrichment and lineage contract', () => {
  it('defines profile strength + market benchmark enrichment functions and grants', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.calculate_profile_strength(');
    expect(sql).toContain('create or replace function public.get_zip_market_benchmark(');
    expect(sql).toContain('create or replace function public.enrich_canonical_facility_payload(');
    expect(sql).toContain("'profile_strength', v_profile_strength");
    expect(sql).toContain("'market_benchmark', v_benchmark");
    expect(sql).toContain('grant execute on function public.enrich_canonical_facility_payload(uuid, jsonb) to authenticated;');
  });

  it('creates internal lineage view for facility traceability', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create view public.api_internal_facility_lineage as');
    expect(sql).toContain('listing_authority_tier');
    expect(sql).toContain('canonical_payload');
    expect(sql).toContain('raw_payload');
    expect(sql).toContain('grant select on table public.api_internal_facility_lineage to authenticated;');
  });

  it('hooks enrichment call in normalization pipeline for facility records', () => {
    const source = fs.readFileSync(normalizeScriptPath, 'utf8');

    expect(source).toContain("evt.canonical_entity === 'facility'");
    expect(source).toContain("supabase.rpc(\n        'enrich_canonical_facility_payload'");
    expect(source).toContain('canonical_payload: canonicalPayload');
  });

  it('extends data contract with trust enrichment output definitions', () => {
    const yaml = fs.readFileSync(contractPath, 'utf8');
    const contract = parse(yaml) as {
      trust_enrichment?: {
        facility_trigger?: string;
        injected_fields?: string[];
        profile_strength_range?: { min?: number; max?: number };
        lineage_view?: string;
      };
    };

    expect(contract.trust_enrichment?.facility_trigger).toBe('normalize_success');
    expect(contract.trust_enrichment?.injected_fields).toEqual(
      expect.arrayContaining(['profile_strength', 'market_benchmark', 'enriched_at'])
    );
    expect(contract.trust_enrichment?.profile_strength_range?.min).toBe(0);
    expect(contract.trust_enrichment?.profile_strength_range?.max).toBe(100);
    expect(contract.trust_enrichment?.lineage_view).toBe('api_internal_facility_lineage');
  });
});

