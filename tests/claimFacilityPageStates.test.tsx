// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; app_metadata: Record<string, string>; user_metadata: Record<string, string> },
  facility: { data: null as any, error: null as any },
  claimable: { data: true as any, error: null as any },
}));

vi.mock('@/src/context/AuthProvider', () => ({
  useAuth: () => ({ user: mocks.user, loading: false }),
}));

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    from: () => ({ select: () => ({ eq: () => ({ single: async () => mocks.facility }) }) }),
    rpc: async () => mocks.claimable,
  },
}));

vi.mock('@/src/config/activationEvents', () => ({ trackActivationEvent: vi.fn() }));
vi.mock('@/src/utils/activationSession', () => ({ getActivationSessionId: () => 'test-session' }));

import { ClaimFacilityPage } from '@/features/operator/ClaimFacilityPage';

const OPERATOR = { id: 'op-1', app_metadata: {}, user_metadata: { role: 'operator' } };
const FAMILY = { id: 'fam-1', app_metadata: {}, user_metadata: { role: 'family' } };
const LISTING = { id: 'dd27d2dd-58fe-4cf5-add0-5e186beba37a', name: 'Abiitan Mill City', address_line1: '100 Test Way', city: 'Minneapolis', state: 'MN', owner_id: null };

const renderAt = () =>
  render(
    <MemoryRouter initialEntries={[`/claim/${LISTING.id}`]}>
      <Routes>
        <Route path="/claim/:id" element={<ClaimFacilityPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('ClaimFacilityPage: one state per listing, and the form only when claimable', () => {
  beforeEach(() => {
    mocks.user = OPERATOR;
    mocks.facility = { data: LISTING, error: null };
    mocks.claimable = { data: true, error: null };
  });
  afterEach(() => cleanup());

  it('shows the claim form for a reviewed, unowned listing', async () => {
    renderAt();
    expect(await screen.findByRole('button', { name: /submit claim request/i })).toBeTruthy();
  });

  it('explains, without a form, when a family account tries to claim', async () => {
    mocks.user = FAMILY;
    renderAt();
    expect(await screen.findByText(/an operator account is needed to claim a listing/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /submit claim request/i })).toBeNull();
    expect(screen.getByRole('button', { name: /create operator account/i })).toBeTruthy();
  });

  it('explains, without a form, when the listing already has an owner', async () => {
    mocks.facility = { data: { ...LISTING, owner_id: 'someone-else' }, error: null };
    renderAt();
    expect(await screen.findByText(/already has an owner/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /submit claim request/i })).toBeNull();
  });

  it('explains, without a form, when the listing is not a reviewed identity', async () => {
    mocks.claimable = { data: false, error: null };
    renderAt();
    expect(await screen.findByText(/cannot be claimed online yet/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /submit claim request/i })).toBeNull();
    expect(screen.getByRole('button', { name: /contact support/i })).toBeTruthy();
  });

  it('says the listing was not found when no row matches', async () => {
    mocks.facility = { data: null, error: { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' } };
    renderAt();
    expect(await screen.findByText(/could not find this listing/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /submit claim request/i })).toBeNull();
  });

  it('fails closed with a clear message when the eligibility check cannot run', async () => {
    mocks.claimable = { data: null, error: { code: 'PGRST202', message: 'Could not find the function' } };
    renderAt();
    expect(await screen.findByText(/could not check this listing right now/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /submit claim request/i })).toBeNull();
  });
});
