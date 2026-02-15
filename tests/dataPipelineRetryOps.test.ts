import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const migrationPath = path.resolve(
  process.cwd(),
  'supabase/migrations/20260215190000_add_normalization_retry_dead_letter.sql'
);
const packageJsonPath = path.resolve(process.cwd(), 'package.json');
const monitorScriptPath = path.resolve(process.cwd(), 'scripts/pipeline_monitor.ts');

describe('data pipeline retry/dead-letter contract', () => {
  it('adds dead-letter storage and retry functions to normalization layer', () => {
    const sql = fs.readFileSync(migrationPath, 'utf8');
    expect(sql).toContain('create table if not exists public.normalization_dead_letters');
    expect(sql).toContain('alter table public.normalization_records');
    expect(sql).toContain('add column if not exists next_retry_at timestamptz');
    expect(sql).toContain('add column if not exists dead_lettered_at timestamptz');
    expect(sql).toContain('create or replace function public.dead_letter_normalization_record(');
    expect(sql).toContain('create or replace function public.mark_normalization_record_retryable(');
    expect(sql).toContain('create or replace function public.get_pending_raw_events_for_normalization(');
    expect(sql).toContain('and nr.dead_lettered_at is null');
  });

  it('wires retry script into pipeline run command and monitors dead-letter counts', () => {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8')) as {
      scripts?: Record<string, string>;
    };
    expect(pkg.scripts?.['pipeline:retry']).toContain('pipeline_retry_dead_letters.ts');
    expect(pkg.scripts?.['pipeline:run']).toContain('pipeline:retry');

    const monitorSource = fs.readFileSync(monitorScriptPath, 'utf8');
    expect(monitorSource).toContain("from('normalization_dead_letters')");
    expect(monitorSource).toContain('dead_letter_count=');
  });
});

