import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// Guards the plan-owner assignment path. The database behaviour is tested against a live local stack
// (see docs/proposed/plan-owner-assignment-rpc-2026-11-09.sql); these checks stop a regression to direct writes.
const read = (path: string) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');

const dashboard = read('features/operator/dashboard/OperatorDashboard.tsx');
const rpcSql = read('docs/proposed/plan-owner-assignment-rpc-2026-11-09.sql');

const RPC_HEADER = 'create or replace function public.set_plan_owner_assignment(';

// The parameter list: from after the opening parenthesis to the line that starts the return type.
const rpcParameters = (): string => {
  const start = rpcSql.indexOf(RPC_HEADER) + RPC_HEADER.length;
  const end = rpcSql.indexOf('\nreturns jsonb', start);
  return rpcSql.slice(start, end);
};

describe('plan-owner assignment', () => {
  it('the dashboard never writes assigned_plan_owner_id directly', () => {
    expect(dashboard).not.toMatch(/update\(\s*\{\s*assigned_plan_owner_id/);
    expect(dashboard).not.toMatch(/\.eq\('assigned_plan_owner_id'/);
  });

  it('assign and release both go through the RPC', () => {
    expect(dashboard).toContain("supabase.rpc('set_plan_owner_assignment'");
    expect(dashboard).toMatch(/p_action: 'assign'/);
    expect(dashboard).toMatch(/p_action: 'release'/);
  });

  it('the dashboard no longer decides the slot limit in the browser', () => {
    expect(dashboard).not.toMatch(/facility_assignments_remaining\s*<=\s*0/);
  });

  it('the RPC is executable by authenticated users only', () => {
    expect(rpcSql).toMatch(/revoke all on function public\.set_plan_owner_assignment\(text, uuid, uuid\) from public, anon;/);
    expect(rpcSql).toMatch(/grant execute on function public\.set_plan_owner_assignment\(text, uuid, uuid\) to authenticated;/);
  });

  it('the RPC takes no owner, plan, billing, or user parameters', () => {
    const params = rpcParameters();
    expect(params).toContain('p_action');
    expect(params).not.toMatch(/user_id|owner|plan|billing|tier/i);
  });

  it("the RPC reads the caller from auth.uid() and locks the caller's profile before counting", () => {
    expect(rpcSql).toContain('v_uid uuid := auth.uid();');
    expect(rpcSql).toMatch(/perform 1 from public\.user_profiles where id = v_uid for update/);
  });
});
