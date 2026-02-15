import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215180000_add_api_v1_read_models.sql'
);
const contractPath = path.resolve(process.cwd(), 'data-contract.yaml');

describe('api read model foundation contract', () => {
  it('defines api_v1 models in data contract', () => {
    const yaml = fs.readFileSync(contractPath, 'utf8');
    const contract = parse(yaml) as {
      api_read_models?: {
        version_prefix?: string;
        models?: string[];
        required_fields?: string[];
      };
    };

    expect(contract.api_read_models?.version_prefix).toBe('api_v1_');
    expect(contract.api_read_models?.models).toEqual(
      expect.arrayContaining([
        'api_v1_facility_profile_summary',
        'api_v1_lead_lifecycle',
        'api_v1_attribution_funnel_daily',
      ])
    );
    expect(contract.api_read_models?.required_fields).toEqual(
      expect.arrayContaining(['data_as_of', 'confidence_score'])
    );
  });

  it('creates stable api_v1 views/materialized view with data_as_of labels', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create view public.api_v1_facility_profile_summary as');
    expect(sql).toContain('create view public.api_v1_lead_lifecycle as');
    expect(sql).toContain('create materialized view public.api_v1_attribution_funnel_daily as');
    expect(sql).toContain('now()::timestamptz as data_as_of');
    expect(sql).toContain('coalesce(lc.confidence_score, 0) as confidence_score');
    expect(sql).toContain('coalesce(ll.confidence_score, 0) as confidence_score');
  });

  it('includes refresh function and controlled grants for authenticated access', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('create or replace function public.refresh_api_v1_read_models()');
    expect(sql).toContain('refresh materialized view concurrently public.api_v1_attribution_funnel_daily;');
    expect(sql).toContain('revoke all on table public.api_v1_facility_profile_summary from public;');
    expect(sql).toContain('grant select on table public.api_v1_facility_profile_summary to authenticated;');
    expect(sql).toContain('grant select on table public.api_v1_lead_lifecycle to authenticated;');
    expect(sql).toContain('grant select on table public.api_v1_attribution_funnel_daily to authenticated;');
  });
});

