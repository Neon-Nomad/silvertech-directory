// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { NoResults } from '@/features/family/discovery/NoResults';

vi.mock('@/src/lib/supabase', () => ({ supabase: { from: () => ({ insert: async () => ({ error: null }) }) } }));
vi.mock('@/src/context/AuthProvider', () => ({ useAuth: () => ({ user: null }) }));
vi.mock('@/src/hooks/useLeadTracking', () => ({ useLeadTracking: () => ({ getSessionId: () => 'test-session', trackLeadEvent: vi.fn() }) }));

describe('no-results request form: every control has an accessible name', () => {
  afterEach(() => cleanup());

  it('names the text, email, phone, select, and textarea fields', () => {
    render(
      <MemoryRouter>
        <NoResults requestedLocation="Minneapolis" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('textbox', { name: 'Your name' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Phone' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Care type' })).toBeTruthy();
    expect(screen.getByRole('combobox', { name: 'Budget' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Anything else we should know' })).toBeTruthy();
  });
});
