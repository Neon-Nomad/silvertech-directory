// @vitest-environment jsdom
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignUpPage } from '@/features/auth/SignUpPage';

const navigateMock = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe('family auth pages operator-intent routing', () => {
  beforeEach(() => {
    navigateMock.mockReset();
  });

  it('reroutes /login with claim-business redirect_to into operator login', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/login?redirect_to=/claim-business']}>
          <LoginPage />
        </MemoryRouter>
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/operator/login?redirect_to=%2Fclaim-business', { replace: true });
    });
  });

  it('reroutes /signup with claim-business redirect_to into operator signup', async () => {
    render(
      <HelmetProvider>
        <MemoryRouter initialEntries={['/signup?redirect_to=/claim-business']}>
          <SignUpPage />
        </MemoryRouter>
      </HelmetProvider>,
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith('/operator/signup?redirect_to=%2Fclaim-business', { replace: true });
    });
  });
});
