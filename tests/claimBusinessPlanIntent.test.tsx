// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ClaimBusiness } from '@/features/operator/claim/ClaimBusiness';

const useAuthMock = vi.fn();

vi.mock('@/src/context/AuthProvider', () => ({
  useAuth: () => useAuthMock(),
}));

describe('ClaimBusiness plan intent routing', () => {
  beforeEach(() => {
    useAuthMock.mockReturnValue({
      user: null,
      loading: false,
    });
  });

  afterEach(() => {
    cleanup();
  });

  it('preserves selected paid plan through operator signup redirect target', () => {
    render(
      <MemoryRouter initialEntries={['/claim-business?plan=featured']}>
        <ClaimBusiness />
      </MemoryRouter>,
    );

    const signupLink = screen.getByRole('link', { name: /create operator account/i });
    const href = signupLink.getAttribute('href') ?? '';
    expect(href).toContain('/operator/signup?redirect_to=%2Fdashboard%2Fbilling%3Fselected_plan%3Dfeatured');
    expect(screen.getByText(/premium access activates only after stripe checkout succeeds/i)).toBeTruthy();
  });

  it('falls back to billing tab without selected plan for invalid plan values', () => {
    render(
      <MemoryRouter initialEntries={['/claim-business?plan=invalid']}>
        <ClaimBusiness />
      </MemoryRouter>,
    );

    const signupLink = screen.getByRole('link', { name: /create operator account/i });
    const href = signupLink.getAttribute('href') ?? '';
    expect(href).toContain('/operator/signup?redirect_to=%2Fdashboard%2Flistings%3Fonboarding%3Dclaim');
    expect(screen.queryByText(/premium access activates only after stripe checkout succeeds/i)).toBeNull();
  });
});
