import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const rpcMigrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215183000_add_data_pipeline_health_rpc.sql'
);
const packageJsonPath = path.resolve(process.cwd(), 'package.json');

describe('data pipeline orchestration contract', () => {
  it('defines pipeline health RPC and grants', () => {
    const sql = fs.readFileSync(rpcMigrationPath, 'utf8');
    expect(sql).toContain('create or replace function public.get_data_pipeline_health()');
    expect(sql).toContain('pending_raw_events bigint');
    expect(sql).toContain('latest_read_model_refresh_at timestamptz');
    expect(sql).toContain("or nr.status in ('ingested', 'rejected')");
    expect(sql).toContain('grant execute on function public.get_data_pipeline_health() to authenticated;');
  });

  it('ships normalize/refresh/monitor scripts and npm commands', () => {
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/pipeline_normalize.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/pipeline_refresh_read_models.ts'))).toBe(true);
    expect(fs.existsSync(path.resolve(process.cwd(), 'scripts/pipeline_monitor.ts'))).toBe(true);

    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };

    expect(pkg.scripts?.['pipeline:normalize']).toBeTruthy();
    expect(pkg.scripts?.['pipeline:refresh-models']).toBeTruthy();
    expect(pkg.scripts?.['pipeline:monitor']).toBeTruthy();
    expect(pkg.scripts?.['pipeline:run']).toContain('pipeline:normalize');
    expect(pkg.scripts?.['pipeline:run']).toContain('pipeline:refresh-models');
    expect(pkg.scripts?.['pipeline:run']).toContain('pipeline:monitor');
  });
});

